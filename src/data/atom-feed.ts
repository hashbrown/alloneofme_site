import { DOMParser, type Element } from '@xmldom/xmldom';

const atomNamespace = 'http://www.w3.org/2005/Atom';
const mediaNamespace = 'http://search.yahoo.com/mrss/';
const maxFeedBytes = 2 * 1024 * 1024;

function children(element: Element, namespace: string, name: string) {
  return Array.from(element.getElementsByTagNameNS(namespace, name))
    .filter((node) => node.parentNode === element);
}

function atomText(element: Element, name: string) {
  return children(element, atomNamespace, name)[0]?.textContent?.trim();
}

function webUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

export function parseAtomFeed(xml: string) {
  if (/<!DOCTYPE/i.test(xml)) throw new Error('Unexpected feed document type');
  const { documentElement: root } = new DOMParser({
    onError(level, message) {
      if (level !== 'warning') throw new Error(message);
    },
  }).parseFromString(xml, 'application/xml');
  if (root?.namespaceURI !== atomNamespace || root.localName !== 'feed') {
    throw new Error('Expected an Atom feed');
  }

  const title = atomText(root, 'title');
  if (!title) throw new Error('Atom feed has no title');
  const description = atomText(root, 'subtitle');
  const entries = children(root, atomNamespace, 'entry');
  const articles = entries.flatMap((entry) => {
    const title = atomText(entry, 'title');
    const link = children(entry, atomNamespace, 'link')
      .find((node) => !node.hasAttribute('rel') || node.getAttribute('rel') === 'alternate');
    const url = webUrl(link?.getAttribute('href'));
    if (!title || !url) return [];

    const thumbnail = webUrl(children(entry, mediaNamespace, 'thumbnail')[0]?.getAttribute('url'));
    const timestamp = Date.parse(atomText(entry, 'published') || atomText(entry, 'updated') || '');
    return [{
      title,
      url: url.href,
      source: url.hostname.replace(/^www\./, ''),
      summary: atomText(entry, 'summary'),
      date: Number.isFinite(timestamp) ? new Date(timestamp) : null,
      thumbnail: thumbnail?.protocol === 'https:' ? thumbnail.href : null,
    }];
  });
  if (entries.length && !articles.length) throw new Error('Feed entries were unusable');
  return { title, description, articles };
}

export async function loadAtomFeed(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok || !response.body) throw new Error(`Feed returned HTTP ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let xml = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxFeedBytes) {
      await reader.cancel();
      throw new Error('Feed response exceeded the size limit');
    }
    xml += decoder.decode(value, { stream: true });
  }
  return parseAtomFeed(xml + decoder.decode());
}

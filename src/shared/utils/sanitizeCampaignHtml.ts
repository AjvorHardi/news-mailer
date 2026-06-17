const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'H2', 'UL', 'OL', 'LI']);

function unwrapElement(element: Element) {
  const parent = element.parentNode;

  if (!parent) {
    element.remove();
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  element.remove();
}

function sanitizeNode(node: Node) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = child as Element;

    if (!allowedTags.has(element.tagName)) {
      unwrapElement(element);
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      element.removeAttribute(attribute.name);
    }

    sanitizeNode(element);
  }
}

export function sanitizeCampaignHtml(html: string | null) {
  if (!html) {
    return null;
  }

  const document = new DOMParser().parseFromString(html, 'text/html');
  sanitizeNode(document.body);

  return document.body.innerHTML;
}

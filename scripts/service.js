const APP_ICON = "m 2.9999997,3 7.2013523,18 h 3.597296 l 1.802028,-4.5 1.798647,4.5 H 21 L 17.399323,12 21,3 H 17.399323 L 15.600676,7.5 13.798648,3 H 10.201352 L 13.798648,12 12,16.5 6.6006764,3 Z m 0,0";

// Twitter/X's copy svg path, used to detect copy button regardless of language. Update if icon changed in UI.
const COPY_LINK_PATH = 'M1 12a7 7 0 0 1 7-7h2v2H8a5 5 0 1 0 0 10h2v2H8a7 7 0 0 1-7-7m20 0a5 5 0 0 0-5-5h-2V5h2a7 7 0 1 1 0 14h-2v-2h2a5 5 0 0 0 5-5m-4-1v2H7v-2z';
const SHARE_BUTTON_SELECTOR = 'button[data-engagement-action="share"]';
const VXSHARE_BUTTON_SELECTOR = 'button[data-engagement-action="vxShare"]';

function waitForElement(parent, selector) {
  return new Promise((resolve) => {
    const element = parent.querySelector(selector);
    if (element) {
      resolve(element);

      return;
    }

    const observer = new MutationObserver(() => {
      const element = parent.querySelector(selector);
      if (element) {
        observer.disconnect();
        clearTimeout(timeout);
        resolve(element);
      }
    });

    let timeout = setTimeout(() => {
      observer.disconnect();
      reject('No element detected');
    }, 5 * 1000);

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
  });
}

async function _getLink(originalShareButton) {
  originalShareButton.click();
  
  const copySvgpath = await waitForElement(
    document.body,
    `path[d="${COPY_LINK_PATH}"]`
  );

  const copyButton = copySvgpath.closest('div[role="menuitem"]');
  copyButton.click();

  return new URL(await navigator.clipboard.readText());
};

async function _updateLink(link) {
  const {
    domain: replacer = 'vxtwitter.com',
    shouldSanitize = true,
  } = await browser.storage.local.get([ 'domain', 'shouldSanitize' ]);
  const updatedOrigin = link.origin.replace("x.com", replacer);

  return updatedOrigin + link.pathname + (shouldSanitize ? "" : link.search);
}

async function copyUpdatedLink(originalShareButton) {
  const link = await _getLink(originalShareButton);
  const updatedLink = await _updateLink(link)

  await navigator.clipboard.writeText(updatedLink);
};


async function appendVx(originalShareButton) {
  const vxButton = originalShareButton.cloneNode(true);

  // Replace SVG
  const svg = vxButton.querySelector("svg");
  // Arbitrary value for optical centering custom button svg
  svg.setAttribute('viewBox', '0 0 26 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute("d", APP_ICON);
  svg.replaceChildren(path);

  vxButton.addEventListener("click", async () => copyUpdatedLink(originalShareButton));
  vxButton.setAttribute('data-engagement-action', 'vxShare');

  originalShareButton.parentNode.appendChild(vxButton);
}

function checkAddedNode(addedNode) {
  if (addedNode.nodeType !== Node.ELEMENT_NODE) return;

  const originalShareButtons = addedNode.querySelectorAll(SHARE_BUTTON_SELECTOR);
  for (const originalShareButton of originalShareButtons) {
    if (originalShareButton.parentNode.querySelector(VXSHARE_BUTTON_SELECTOR)) return;

    appendVx(originalShareButton);
  }
}

async function main() {
  const main = await waitForElement(document.body, 'main');
  const mainObserver = new MutationObserver(async (mutations) => {
    for (const mutation of mutations){
      for (const addedNode of mutation.addedNodes) {
        checkAddedNode(addedNode);
      }
    }
  })

  mainObserver.observe(main, {childList: true, subtree: true})
}

main();

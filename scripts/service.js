const APP_ICON = "m 2.9999997,3 7.2013523,18 h 3.597296 l 1.802028,-4.5 1.798647,4.5 H 21 L 17.399323,12 21,3 H 17.399323 L 15.600676,7.5 13.798648,3 H 10.201352 L 13.798648,12 12,16.5 6.6006764,3 Z m 0,0";
const COPY_LINK_PATH = 'M1 12a7 7 0 0 1 7-7h2v2H8a5 5 0 1 0 0 10h2v2H8a7 7 0 0 1-7-7m20 0a5 5 0 0 0-5-5h-2V5h2a7 7 0 1 1 0 14h-2v-2h2a5 5 0 0 0 5-5m-4-1v2H7v-2z';
const SHARE_BUTTON_SELECTOR = 'button[data-engagement-action="share"]';

function waitForElements(parent, selector) {
  return new Promise((resolve) => {
    if (parent.querySelector(selector)) {
      return resolve(parent.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (parent.querySelector(selector)) {
        observer.disconnect();
        resolve(parent.querySelector(selector));
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
  });
}

async function _onClick(originalPressable) {
  originalPressable.click();
  const copy = await waitForElements(
    document.body,
    `path[d="${COPY_LINK_PATH}"]`
  );
  // path.svg.span.div
  copy.parentNode.parentNode.parentNode.click();
  const link = new URL(await navigator.clipboard.readText());
  let replacer, shouldSanitize;
  await browser.storage.local.get([ 'domain', 'shouldSanitize' ]).then(
    (result) => {
      replacer = result.domain ? result.domain : 'vxtwitter.com';
      shouldSanitize = result.shouldSanitize ?? true;
    }
  );
  const updatedOrigin = link.origin.replace("x.com", replacer);
  const updatedLink = updatedOrigin + link.pathname + (shouldSanitize ? "" : link.search);
  navigator.clipboard.writeText(updatedLink);
};


async function appendVx(originalShareButton) {
  const vxButton = originalShareButton.cloneNode(true);
  const svg = vxButton.querySelector("svg");
  svg.setAttribute('viewBox', '0 0 26 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute("d", APP_ICON);
  svg.replaceChildren(path);
  vxButton.addEventListener("click", async () => _onClick(originalShareButton));
  originalShareButton.parentNode.appendChild(vxButton);
}

async function main() {
  const main = await waitForElements(document.body, 'main');
  const mainObserver = new MutationObserver(async (mutations) => {
    for (const mutation of mutations){
      for (const addedNode of mutation.addedNodes) {
        const originalShareButtons = addedNode.querySelectorAll(SHARE_BUTTON_SELECTOR);
          for (const originalShareButton of originalShareButtons) {
            appendVx(originalShareButton)
          }
      }
    }
  })
  mainObserver.observe(main, {childList: true, subtree: true})
}

main();

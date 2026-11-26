const APP_ICON = 'm 2.9999997,3 7.2013523,18 h 3.597296 l 1.802028,-4.5 1.798647,4.5 H 21 L 17.399323,12 21,3 H 17.399323 L 15.600676,7.5 13.798648,3 H 10.201352 L 13.798648,12 12,16.5 6.6006764,3 Z m 0,0';

// Twitter/X's selector for share button.
// Update if any changes in UI.
const SHARE_BUTTON_SELECTOR = 'button[data-engagement-action="share"]';
const VXSHARE_BUTTON_SELECTOR = 'button[data-engagement-action="vxShare"]';

const config = {};

function waitForElement(parent, selector) {
  return new Promise((resolve, reject) => {
    const element = parent.querySelector(selector);
    if (element) {
      resolve(element);

      return;
    }

    let timeout;
    const observer = new MutationObserver(() => {
      const newElement = parent.querySelector(selector);
      if (newElement) {
        observer.disconnect();
        clearTimeout(timeout);
        resolve(newElement);
      }
    });

    timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error('No element detected'));
    }, 5 * 1000);

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
  });
}

function getPathname(originalShareButton) {
  const pathname = originalShareButton.closest('div[data-href]')?.getAttribute('data-href');

  return pathname || window.location.pathname;
}

async function getLink(originalShareButton) {
  const pathname = getPathname(originalShareButton);
  const host = config.domain || 'vxtwitter.com';

  return new URL(`https://${host}${pathname}`);
}

async function copyUpdatedLink(originalShareButton) {
  try {
    const url = await getLink(originalShareButton);

    await navigator.clipboard.writeText(url.toString());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[VXShare] Failed to copy link: ', error);
  }
}

async function appendVx(originalShareButton) {
  const vxButton = originalShareButton.cloneNode(true);

  // Replace SVG
  const svg = vxButton.querySelector('svg');
  // Arbitrary value for optical centering custom button svg
  svg.setAttribute('viewBox', '0 0 26 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', APP_ICON);
  svg.replaceChildren(path);

  vxButton.addEventListener('click', async () => copyUpdatedLink(originalShareButton));
  vxButton.setAttribute('data-engagement-action', 'vxShare');

  originalShareButton.parentNode.appendChild(vxButton);
}

// Checks if post has timestamp
// So far only boosted/ads don't have timestamp on the posts
function postIsAd(post) {
  // When clicking on a post, it has no timestamp beside the handle
  const header = post.querySelector('div.x-middot-group');
  if (!header) return false;

  const span = header.querySelector(':scope > span');

  return !span;
}

function checkAddedNode(addedNode) {
  if (addedNode.nodeType !== Node.ELEMENT_NODE) return;

  const originalShareButtons = addedNode.querySelectorAll(SHARE_BUTTON_SELECTOR);
  originalShareButtons.forEach((originalShareButton) => {
    const li = originalShareButton.closest('li[data-index]');
    if (config.shouldHideAds && li && postIsAd(li)) {
      li.replaceChildren();
      return;
    }

    if (originalShareButton.parentNode.querySelector(VXSHARE_BUTTON_SELECTOR)) return;

    appendVx(originalShareButton);
  });
}

async function updateConfig() {
  const {
    domain,
    shouldHideAds,
  } = await browser.storage.local.get(['domain', 'shouldHideAds']);

  config.domain = domain ?? 'vxtwitter.com';
  config.shouldHideAds = shouldHideAds ?? true;
}

async function main() {
  await updateConfig();
  const mainElement = await waitForElement(document.body, 'main');
  // Populate existing timeline (like when restoring from SPA cache)
  mainElement.querySelectorAll(SHARE_BUTTON_SELECTOR).forEach(appendVx);

  const mainObserver = new MutationObserver(async (mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(checkAddedNode);
    });
  });

  mainObserver.observe(mainElement, { childList: true, subtree: true });
}

main();

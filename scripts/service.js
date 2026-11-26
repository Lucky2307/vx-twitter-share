const APP_ICON = 'm 3 3 L 10.2014 21 L 13.7986 21 L 15.6007 16.5 L 17.3993 21 L 21 21 L 17.3993 12 L 21 3 L 17.3993 3 L 15.6007 7.5 L 13.7986 3 L 10.2014 3 L 13.7986 12 L 12 16.5 L 6.6007 3 Z m 0 0';
const SUCCESS_ICON = 'm 6.7 12 L 10.2014 21 L 13.7986 21 L 15.6007 16.5 L 15.6007 16.5 L 17.3993 12 L 17.3993 12 L 21 3 L 17.3993 3 L 15.6007 7.5 L 15.6007 7.5 L 13.7986 12 L 13.7986 12 L 12 16.5 L 10 12 Z m 0 0';

// Twitter/X's selector for share button.
// Update if any changes in UI.
const SHARE_BUTTON_SELECTOR = 'button[data-engagement-action="share"]';
const VXSHARE_BUTTON_SELECTOR = 'button[data-engagement-action="vxShare"]';

const config = {};

async function morphIcon(icon, to) {
  const from = icon.getAttribute('d') || APP_ICON;
  if (from === to) return;

  icon.getAnimations().forEach((animation) => animation.cancel());
  icon.animate(
    [{ d: `path("${from}")` }, { d: `path("${to}")` }],
    { duration: 160, easing: 'ease-in-out', fill: 'forwards' },
  );

  icon.setAttribute('d', to); // commit
}

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

async function updateIcon(path) {
  await morphIcon(path, SUCCESS_ICON);
  path.setAttribute('fill', 'var(--x-fg-brand)');
  setTimeout(() => {
    path.removeAttribute('fill');
    morphIcon(path, APP_ICON);
  }, 1000);
}

async function copyUpdatedLink(originalShareButton, icon) {
  try {
    const url = await getLink(originalShareButton);

    await navigator.clipboard.writeText(url.toString());
    updateIcon(icon);
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

  vxButton.addEventListener('click', async () => copyUpdatedLink(originalShareButton, path));
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

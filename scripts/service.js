const COPY_LINK_PATH = "M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05 8.46 5.64l1.42-1.42c2.73-2.73 7.16-2.73 9.9 0 2.73 2.74 2.73 7.17 0 9.9l-1.42 1.42-1.41-1.42 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-12.02.71l1.42-1.42 1.41 1.42-1.41 1.41c-1.96 1.96-1.96 5.12 0 7.07 1.95 1.96 5.11 1.96 7.07 0l1.41-1.41 1.42 1.41-1.42 1.42c-2.73 2.73-7.16 2.73-9.9 0-2.73-2.74-2.73-7.17 0-9.9z";
const APP_ICON = "m 2.9999997,3 7.2013523,18 h 3.597296 l 1.802028,-4.5 1.798647,4.5 H 21 L 17.399323,12 21,3 H 17.399323 L 15.600676,7.5 13.798648,3 H 10.201352 L 13.798648,12 12,16.5 6.6006764,3 Z m 0,0";


function waitForElements(parent, selector) {
  return new Promise((resolve) => {
    if (parent.querySelector(selector)) {
      return resolve(parent.querySelectorAll(selector));
    }

    const observer = new MutationObserver(() => {
      if (parent.querySelector(selector)) {
        observer.disconnect();
        resolve(parent.querySelectorAll(selector));
      }
    });

    observer.observe(parent, {
      childList: true,
      subtree: true,
    });
  });
}

async function _onClick(originalPressable) {
  originalPressable[0].click();
  const dropdown = await waitForElements(
    document.body,
    "[data-testid=Dropdown]"
  );
  const items = dropdown[0].querySelectorAll('[role="menuitem"]');
  const copy = Array.from(items).find(
    (item) => item.querySelector("svg path")?.getAttribute("d") === COPY_LINK_PATH
  );
  copy.click();
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


async function appendVx(post) {
  const originalPressable = await waitForElements(
    post,
    '[aria-label$="Share post"]'
  );
  const originalButton = originalPressable[0].parentNode.parentNode;
  const vxButton = originalButton.cloneNode(true);
  const path = vxButton.getElementsByTagName("path")[0];
  path.setAttribute("d", APP_ICON);
  vxButton.addEventListener("click", async () => _onClick(originalPressable));
  originalButton.parentNode.appendChild(vxButton);
}

async function initialDivs() {
  const cellDivs = await waitForElements(
    document.body,
    "[data-testid=cellInnerDiv]"
  );
  cellDivs.forEach((div) => {
    appendVx(div);
  });
}

async function startObserve() {
  await initialDivs();
  const timeline = document.querySelector(
    "[data-testid=cellInnerDiv]"
  ).parentNode;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        appendVx(mutation.addedNodes[0]);
      }
    });
  });
  observer.observe(timeline, { childList: true });
}

async function main() {
  const main = await waitForElements(document.body, "[role=main]");
  await waitForElements(document.body, "[data-testid=cellInnerDiv]");
  const mainDiv = main[0].childNodes[0];
  startObserve();
  const mainObserver = new MutationObserver((mutations) => {
    if (
      !(
        mutations[1].addedNodes[0].childNodes[0].getAttribute("aria-label") ===
        "Loading"
      )
    )
      startObserve();
  });
  mainObserver.observe(mainDiv, { childList: true });
}

main();

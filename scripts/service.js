const d =
  "m 2.9999997,3 7.2013523,18 h 3.597296 l 1.802028,-4.5 1.798647,4.5 H 21 L 17.399323,12 21,3 H 17.399323 L 15.600676,7.5 13.798648,3 H 10.201352 L 13.798648,12 12,16.5 6.6006764,3 Z m 0,0";

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

async function appendVx(post) {
  const originalPressable = await waitForElements(
    post,
    '[aria-label$="Share post"]'
  );
  const originalButton = originalPressable[0].parentNode.parentNode;
  const vxButton = originalButton.cloneNode(true);
  const path = vxButton.getElementsByTagName("path")[0];
  path.setAttribute("d", d);
  vxButton.addEventListener("click", async () => {
    originalPressable[0].click();
    const dropdown = await waitForElements(
      document.body,
      "[data-testid=Dropdown]"
    );
    const [copy] = dropdown[0].childNodes;
    copy.click();
    const link = await navigator.clipboard.readText();
    const vxLink = link.replace("x.com", "vxtwitter.com");
    navigator.clipboard.writeText(vxLink);
  });
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

const parser = new DOMParser();
const rawLogo = parser.parseFromString(
  `
  <div style="height: 80px; width: 80px">
<svg
   viewBox="0 0 24 24"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <path
     style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.865515"
     d="m 2.9999997,3 7.2013523,18 h 3.597296 l 1.802028,-4.5 1.798647,4.5 H 21 L 17.399323,12 21,3 H 17.399323 L 15.600676,7.5 13.798648,3 H 10.201352 L 13.798648,12 12,16.5 6.6006764,3 Z m 0,0"
     id="path2" />
</svg>
</div>
`,
  "text/xml"
).documentElement;
const d =
  "m 2.9999997,3 7.2013523,18 h 3.597296 l 1.802028,-4.5 1.798647,4.5 H 21 L 17.399323,12 21,3 H 17.399323 L 15.600676,7.5 13.798648,3 H 10.201352 L 13.798648,12 12,16.5 6.6006764,3 Z m 0,0";

const img = `
<img>
`;

function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

console.log("Extension loaded");
async function main() {
  const originalPressable = await waitForElement('[aria-label$="Share post"]');
  const originalButton = originalPressable.parentNode.parentNode;
  console.log("replaced");
  const clonedButton = originalButton.cloneNode(true);
  clonedButton.addEventListener("click", async () => {
    originalPressable.click();
    const dropdown = await waitForElement("[data-testid=Dropdown]");
    const [copy] = dropdown.childNodes;
    copy.click();
    const link = await navigator.clipboard.readText();
    const vxLink = link.replace("x.com", "vxtwitter.com");
    navigator.clipboard.writeText(vxLink);
  });
  const path = clonedButton.getElementsByTagName("path")[0];
  path.setAttribute("d", d);
  originalButton.parentNode.appendChild(clonedButton);

  chrome.tabs.onUpdated.addListener(() => console.log("OnUpdated"));
}

window.addEventListener("load", main);

// TODO
// Change logic to:
// 1. Use the share button
// 2. Add Copy VX Link to menu item
// 3. Trigger original copy, replace with VX

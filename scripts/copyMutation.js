const d =
  "m 2.9999997,3 7.2013523,18 h 3.597296 l 1.802028,-4.5 1.798647,4.5 H 21 L 17.399323,12 21,3 H 17.399323 L 15.600676,7.5 13.798648,3 H 10.201352 L 13.798648,12 12,16.5 6.6006764,3 Z m 0,0";

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

function findDropDownFromMutation(mutation) {
  return mutation.addedNodes[0].querySelector("[data-testid=Dropdown]");
}

function createVxMenuItem(source) {
  const vxCopyItem = source.cloneNode(true);
  vxCopyItem.getElementsByTagName("span")[0].innerHTML = "Copy VX link";
  vxCopyItem.getElementsByTagName("path")[0].setAttribute("d", d);
  vxCopyItem.addEventListener("click", () => {
    source.click();
    console.log("click");
  });
  return vxCopyItem;
}

function appendVx(target) {
  const [copyItem, shareItem] = target.childNodes;
  const vxItem = createVxMenuItem(copyItem);
  target.insertBefore(vxCopyItem, shareItem);
  console.log(target);
}

async function main() {
  const menuObserver = new MutationObserver((mutations) => {
    const dropdownMutation = mutations.find((mutation) => {
      if (mutation.addedNodes.length > 0) {
        return findDropDownFromMutation(mutation);
      }
    });
    if (dropdownMutation) appendVx(findDropDownFromMutation(dropdownMutation));
  });
  const layersNode = await waitForElement("#layers");
  menuObserver.observe(layersNode, { childList: true, subtree: true });
}

main();

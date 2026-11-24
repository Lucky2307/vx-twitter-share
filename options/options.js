const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const saveOptions = debounce(() => {
  const domain = document.getElementById('domain').value;
  const shouldHideAds = document.getElementById('shouldHideAds').checked;

  browser.storage.local.set(
    { domain, shouldHideAds },
  ).then(() => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = 'Reload your X page if the options didn\'t get applied';
    }, 750);
  });
}, 500);

const updateExample = (domain) => {
  const link = `https://${domain || 'vxtwitter.com'}/horsetwting/status/1948517385096364300`;
  const exampleLink = document.getElementById('exampleLink');
  exampleLink.textContent = link;
};

const onChange = () => {
  const domain = document.getElementById('domain').value;

  updateExample(domain);
  saveOptions();
};

const restoreOptions = async () => {
  await browser.storage.local.get(
    ['domain', 'shouldHideAds'],
  ).then((items) => {
    const {
      domain = 'vxtwitter.com',
      shouldHideAds = true,
    } = items;
    document.getElementById('domain').value = domain;
    document.getElementById('shouldHideAds').checked = shouldHideAds;

    updateExample(domain);
  });
};

document.addEventListener('keyup', onChange);
document.getElementById('shouldHideAds').addEventListener('change', onChange);
document.addEventListener('DOMContentLoaded', restoreOptions);

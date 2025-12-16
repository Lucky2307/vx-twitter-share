import debounce from '../utils/debounce.js';

const saveOptions = debounce(() => {
  const domain = document.getElementById('domain').value;
  const shouldSanitize = document.getElementById('shouldSanitize').checked;

  browser.storage.local.set(
    { domain: domain, shouldSanitize: shouldSanitize }
  ).then(() => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}, 500);

const updateExample = (domain, shouldSanitize) => {
  const link = `https://${domain ? domain : 'vxtwitter.com'}/horsetwting/status/1948517385096364300${shouldSanitize ? '' : '?s=20'}`;
  const exampleLink = document.getElementById('exampleLink');
  exampleLink.textContent = link;
}

const onChange = () => {
  const domain = document.getElementById('domain').value;
  const shouldSanitize = document.getElementById('shouldSanitize').checked;

  updateExample(domain, shouldSanitize);
  saveOptions();
}

const restoreOptions = async () => {
  await browser.storage.local.get(
    ['domain', 'shouldSanitize']
  ).then((items) => {
    const {
      domain = 'vxtwitter.com',
      shouldSanitize = true
    } = items
    document.getElementById('domain').value = domain;
    document.getElementById('shouldSanitize').checked = shouldSanitize;

    updateExample(domain, shouldSanitize);
  });
};

document.addEventListener('keyup', onChange);
document.getElementById('shouldSanitize').addEventListener('change', onChange);
document.addEventListener('DOMContentLoaded', restoreOptions);
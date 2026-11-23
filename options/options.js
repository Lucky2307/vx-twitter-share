const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const saveOptions = debounce(() => {
  const domain = document.getElementById('domain').value;

  browser.storage.local.set(
    { domain },
  ).then(() => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
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
    ['domain'],
  ).then((items) => {
    const {
      domain = 'vxtwitter.com',
      shouldSanitize = true,
    } = items;
    document.getElementById('domain').value = domain;

    updateExample(domain, shouldSanitize);
  });
};

document.addEventListener('keyup', onChange);
document.addEventListener('DOMContentLoaded', restoreOptions);

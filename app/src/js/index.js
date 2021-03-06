import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Root from './routes/index';
import store from './store';

const settings = require('electron-settings');
const { ipcRenderer } = require('electron');

window.onerror = (msg) => {
  console.log(msg);
  const reqListener = () => {
    console.log(this.responseText);
  };

  const oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open(
    'GET',
    `https://us-central1-devrantron.cloudfunctions.net/logError?error=${msg}`,
  );
  oReq.send();

  const doesExist = document.getElementsByClassName('reset_button')[0];

  if (!doesExist) {
    const div = document.createElement('div');
    div.innerHTML = `
      <p>We have hit an error! If the app crashed, please reset the cache</p>
    `;
    const btn = document.createElement('button');
    const t = document.createTextNode('Reset Cache'); // Create a text node
    btn.appendChild(t);
    btn.onclick = () => {
      settings.deleteAll();

      ipcRenderer.send('reLaunch', true);
    };

    div.appendChild(btn);

    // better to use CSS though - just set class
    div.setAttribute('class', 'reset_button'); // and make sure myclass has some styles in css
    document.body.appendChild(div);

    setTimeout(() => {
      document.body.removeChild(div);
    }, 3000);
  }


  const suppressErrorAlert = true;
  // If you return true, then error alerts (like in older versions of
  // Internet Explorer) will be suppressed.
  return suppressErrorAlert;
};

const render = (Component) => {
  ReactDOM.render(
    <Provider store={store}>
      <Component />
    </Provider>,
    document.getElementById('root'),
  );
};

render(Root);

if (module.hot) {
  module.hot.accept('./routes/index', () => {
    // eslint-disable-next-line
    const nextApp = require('./routes/index').default;
    render(nextApp);
  });
}

document.addEventListener('keydown', (e) => {
  if (e.which === 123) {
    // eslint-disable-next-line
    require('electron').remote.getCurrentWindow().toggleDevTools();
  } else if (e.which === 116) {
    // eslint-disable-next-line
    location.reload();
  }
});

// Warning message in console
setTimeout(() => {
  console.log("%cHollup!\n%cSince you're most likley a dev ya already know this, but just to be sure, if anyone told you to write something here you're 110% getting screwed. ", 'color: red; font-size:64px; -webkit-text-stroke: 2px black;', 'color: red; font-size:14px;');
}, 1000);

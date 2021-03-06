import { SETTINGS, ITEM } from '../consts/types';
import { fetchUser } from './user';
import { fetchNotifs } from './notifs';
import { openModal } from './modal';

const { ipcRenderer } = require('electron');
const settings = require('electron-settings');


/**
 * Sets auto launch at OS startup
 * It sends a message to main process which sets the setting
 *
 * @param {bool} value
 */
const setAutoLaunch = (value) => {
  if (value) {
    ipcRenderer.send('auto-launch', true);
  } else {
    ipcRenderer.send('auto-launch', false);
  }
};
/**
 * Sets the webContents.zoomLevel
 * It sends a message to main process which sets the setting
 *
 * @param {float} value
 */
const setZoomLevel = (value) => {
  ipcRenderer.send('zoom-level', value);
};


/**
 * Saves the current state of the app
 *
 */
const saveUserState = () => (dispatch, getState) => {
  const state = getState();
  const customCols = [...state.columns];
  for (let index = 0; index < customCols.length; index += 1) {
    customCols[index].items = [];
    customCols[index].prev_set = 0;
    customCols[index].page = 0;
  }
  // We don't need to save everything, select the ones that we really need
  const savedState = {
    auth: state.auth,
    user: state.user,
    settings: state.settings,
    notifs: state.notifs,
    columns: customCols,
    search: state.search,
    postRant: state.postRant,
  };
  /**
   * Use localStorage to save the state. Much better than a file.
   * EDIT: I was wrong. LocalStorage is not saved is the app crashes abnormally.
   * so I will be using electron-settings package
   */
  settings.set('currentVersion', savedState);
};


/**
 * If the user wants to minimise the app when quit button is clicked
 *
 * @param {bool} value should minimise on close?
 */
const setMinimiseOnClose = value => (dispatch) => {
  if (value) {
    window.onbeforeunload = (e) => {
      ipcRenderer.send('minimiseApp');
      e.returnValue = false;
    };
  } else {
    window.onbeforeunload = () => {
      dispatch(saveUserState());
    };
  }
};

/**
 * If there is a new update, this sets the appropriate settings
 *
 * @param {bool} value is there a new update?
 */
const setUpdateStatus = value => (dispatch) => {
  if (value) {
    dispatch({
      type: SETTINGS.ACTION.CHANGE_GENERAL,
      primaryKey: 'update',
      buttonText: 'Update availble',
      value: true,
    });

    const notification = new Notification('devRantron', {
      body: 'New update is availble',
      icon: 'http://i.imgur.com/iikd00P.png',
      requireInteraction: true,
    });

    notification.onclick = () => {
      dispatch(openModal(ITEM.RELEASE_INFO.NAME));
    };
  } else {
    dispatch({
      type: SETTINGS.ACTION.CHANGE_GENERAL,
      primaryKey: 'update',
      buttonText: 'Up to date',
      value: false,
    });
  }
};


/**
 * If the app has been launched for the first time, set some default settings
 *
 */
const setFirstLaunch = () => (dispatch) => {
  setAutoLaunch(true);
  dispatch(setMinimiseOnClose(true));
};


/**
 * Sets some settings according to saved user state on app startup
 * Auto launch and minimiseOnClose has to be set everytime the app starts up
 *
 */
const setOnStartup = () => (dispatch, getState) => {
  dispatch(fetchUser());
  dispatch(fetchNotifs());
  const generalSettings = getState().settings.general;
  if (generalSettings.autoLaunch.value === true) {
    setAutoLaunch(true);
  } else {
    setAutoLaunch(false);
  }
  if (generalSettings.minimiseOnClose.value === true) {
    dispatch(setMinimiseOnClose(true));
  } else {
    dispatch(setMinimiseOnClose(false));
  }
  if (generalSettings.zoomLevel.value !== 0) {
    setZoomLevel(generalSettings.zoomLevel.value);
  }
};


/**
 * Logs in the user
 *
 * @param {string} username Either username or email
 * @param {string} password Password for the user
 */
const changeGeneral = (primaryKey, secondaryKey, value) => (dispatch) => {
  if (primaryKey === 'autoLaunch') {
    setAutoLaunch(value);
  }
  if (primaryKey === 'zoomLevel') {
    setZoomLevel(value);
  }
  if (primaryKey === 'minimiseOnClose') {
    dispatch(setMinimiseOnClose(value));
  }
  if (primaryKey === 'update') {
    dispatch(saveUserState());
    dispatch(openModal(ITEM.RELEASE_INFO.NAME));
  }
  if (primaryKey === 'reset_cache') {
    settings.deleteAll();
    ipcRenderer.send('reLaunch', true);
    return;
  }
  dispatch({
    type: SETTINGS.ACTION.CHANGE_GENERAL,
    primaryKey,
    secondaryKey,
    value,
  });
};


/**
 * We will use this for theming in future
 *
 */
const changeTheme = (key, values = null) => (dispatch) => {
  dispatch({
    type: SETTINGS.ACTION.CHANGE_THEME,
    key: values ? null : key,
    values,
  });
};


export {
  changeGeneral,
  changeTheme,
  setAutoLaunch,
  saveUserState,
  setFirstLaunch,
  setOnStartup,
  setUpdateStatus };

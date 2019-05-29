/* global chrome */

import React from 'react';
import logo from './aikido.png';
import './App.css';
import { Switch, Input, message } from 'antd';
import Autolinker from 'autolinker';
import * as UrlParser from 'url-parse';

let blockButton = new React.createRef();

function blockWebsite(e) {
  let url = e.target.getAttribute('value');

  blockButton.current.setValue('')

  let matches = Autolinker.parse(url, {
    urls: true,
    email: true
  });

  if (!matches.length) return message.error('No valid link.');

  let urls = matches.map(convertToRegex);

  if (!(chrome && chrome.storage)) return; // not inside chrome environment.


  chrome.storage.sync.get(['blockedUrls'], function(result) {
    console.log('Value currently is ' + result.blockedUrls);
    let blockedUrls = result.blockedUrls || [];
    blockedUrls.push(...urls);
    chrome.storage.sync.set({blockedUrls}, function() {
      console.log('Value is set to ' + blockedUrls);
      message.success(`Blocked ${url}`);
    });
  });
}

function convertToRegex(match) {
  let url = match.getUrl();
  let parser = new UrlParser(url);
  parser.set('protocol', '*:');
  let regex = `*://*.${parser.hostname}/*`;
  return regex;
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <Switch />
        </div>
        <p>
          Distraction Shield
        </p>
        <div>
          <img src={logo} className="App-logo" alt="logo" />
        </div>
      </header>
      <Input ref={blockButton}
             placeholder="Block website" 
             onPressEnter={(e) => blockWebsite(e)} />
    </div>
  );
}

export default App;

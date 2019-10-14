import React from 'react';
import logo from './logo.svg';
import './App.css';
import { clone } from '@babel/types';
import dict from './assets/dict.json'
const { ipcRenderer } = window.require("electron");


function App() {
  let [osdValue, setOsdValue] = React.useState({ "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "10": "", "11": "", "12": "", "13": "", "14": "", "15": "", "16": "" })
  let [connectionState, setConnectionState] = React.useState(1)

  //handle connection status update
  const handleConnectionStatus = (event, data) => {
    setConnectionState(data)
    console.log(data);
  }

  //handle new osd line
  const handleMessage = (event, data) => {
    //check if it is a osd line
    if (data.toString().includes("[")) {
      let commands = data.toString().split('[')
      commands.forEach(element => {
        if (element.toString().includes('H')) {
          setConnectionState(4)
          //split line num and value
          let content = element.split('H')[1].replace('', '')
          let lineNum = element.split('H')[0].split(';')[0]
          //update displayed content
          const cloneState = osdValue;
          cloneState[lineNum] = content
          setOsdValue(osdValue => { return Object.assign({}, { ...cloneState }) })
        }
      });
    }
  }
  React.useState(() => {
    ipcRenderer.on("catchConnectionStatus", handleConnectionStatus)
    ipcRenderer.on("catchMessage", handleMessage)
    ipcRenderer.on("catchLog", (data) => {
      console.log(data);
    })
    return (false);
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <p>{
          //retorn statusmessage if no osd readout active
          connectionState !== 4 ? dict["statusMessage"][connectionState] : ""}</p>
        {connectionState === 4 ? (Object.values(osdValue).map((value, index) => {
          return (<div className="osd-line">{value.replace(/ /g, "\u00a0")}</div>)
        })) : <div></div>}
        {
          //buttons
          connectionState === 4 ? <div className="actionButtons">
            <button onClick={() => { ipcRenderer.send('catch_on_main', "backup"); setConnectionState(5) }}>Save Settings to File</button>
            <button onClick={() => { ipcRenderer.send('catch_on_main', "restore"); setConnectionState(6) }}>Restore Settings from File</button>
            <button onClick={() => { ipcRenderer.send('catch_on_main', "dfu"); setConnectionState(7) }}>Enter DFU Mode</button>
          </div> : <div></div>
        }
      </header>
    </div>
  );
}

export default App;

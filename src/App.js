import React from 'react';
import logo from './logo.svg';
import './App.css';
import { clone } from '@babel/types';
const { ipcRenderer } = window.require("electron");


function App() {
  let [osdValue, setOsdValue] = React.useState({ "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "10": "", "11": "", "12": "", "13": "", "14": "", "15": "", "16": "" })
  let [connection, setConnection] = React.useState('No FC connected')
  const handleMessage = (event, data) => {
    console.log(data);
    if (data.toString().includes("attatched")) {
      setConnection('Please wait, connecting to FC ...')
    }
    if (data.toString().includes("ddd")) {
      setConnection('No FC connected')
    }
    if (data.toString().includes("success")) {
      setConnection('Success!')
    }
    if (data.toString().includes("fail")) {
      setConnection('Aborted!')
    }
    if (data.toString().includes("[")) {

      let commands = data.toString().split('[')
      commands.forEach(element => {
        if (element.toString().includes('H')) {
          if (!connection.includes("Saving")) {
            setConnection('data')
          }
          let content = element.split('H')[1]
          let lineNum = element.split('H')[0].split(';')[0]
          const cloneState = osdValue;
          cloneState[lineNum] = content
          setOsdValue(osdValue => { return Object.assign({}, { ...cloneState }) })
        }
      });
    }
  }

  React.useState(() => {
    ipcRenderer.on("catch_on_render", handleMessage)
    return (false);
  }, [])
  let prompt;
  if (connection == 0) {
    prompt = "No Device connected"
  } else if (connection == 1) {
    prompt = "Connecting to FC, Please Wait!"
  } else {
    prompt = ""
  }
  return (
    <div className="App">
      <header className="App-header">

        <p>{connection != 'data' ? connection : ""}</p>
        {connection == 'data' ? (Object.values(osdValue).map((value, index) => {
          return (<div className="osd-line">{value}</div>)
        })) : <div></div>}

        {
          connection == 'data' ? <div className="actionButtons">
            <button onClick={() => { ipcRenderer.send('catch_on_main', "backup"); setConnection('Saving Settings... Please wait!') }}>Save Settings to File</button>
            <button onClick={() => { ipcRenderer.send('catch_on_main', "restore"); setConnection('Restoring... Please wait!') }}>Restore Settings from File</button>
            <button onClick={() => { ipcRenderer.send('catch_on_main', "dfu"); setConnection('Entered DFU!') }}>Enter DFU Mode</button>
          </div> : <div></div>
        }

      </header>
    </div>
  );
}

export default App;

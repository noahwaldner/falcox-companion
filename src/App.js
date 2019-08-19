import React from 'react';
import logo from './logo.svg';
import './App.css';
import { clone } from '@babel/types';
const { ipcRenderer } = window.require("electron");


function App() {
  let [osdValue, setOsdValue] = React.useState({ "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "10": "", "11": "", "12": "", "13": "", "14": "", "15": "", "16": "" })
  let [connection, setConnection] = React.useState(0)
  const handleMessage = (event, data) => {

    if (data.toString().includes("attatched")) {
      console.log("attatched");
      setConnection(1)
    }

    if (data.toString().includes("ddd")) {
      console.log("detached");
      setConnection(0)
    }

    if (data.toString().includes("[")) {
      setConnection(2)
      let commands = data.toString().split('[')
      commands.forEach(element => {
        if (element.toString().includes('H')) {
          let content = element.split('H')[1]
          let lineNum = element.split('H')[0].split(';')[0]
          console.log(lineNum, content);
          const cloneState = osdValue;
          cloneState[lineNum] = content

          setOsdValue(osdValue => { return Object.assign({}, { ...cloneState }) })
          console.log(osdValue);

        }
      });
    }
  }

  React.useState(() => {
    ipcRenderer.on("catch_on_render", handleMessage)
    return (false);
  }, [])

  return (
    <div className="App">
      <header className="App-header">

        <p>{prompt}</p>
        {connection == 2 ? (Object.values(osdValue).map((value, index) => {
          return (<div className="osd-line">{value}</div>)
        })) : <div></div>}


      </header>
    </div>
  );
}

export default App;

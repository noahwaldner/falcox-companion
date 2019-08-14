import React from 'react';
import logo from './logo.svg';
import './App.css';
const { ipcRenderer } = window.require("electron");


function App() {
  let [osdValue, setOsdValue] = React.useState({ "1": "", "2": "", "3": "", "4": "", "5": "", "6": "", "7": "", "8": "", "9": "", "10": "", "11": "", "12": "", "13": "", "14": "", "15": "", "16": "" })

  const handleMessage = (event, data) => {


    if (data.toString().includes("DL")) {

      let osdValuePair = data.split(",")

      let lineIndex = osdValuePair[0].split(" ")[1] - 1
      let lineValue = osdValuePair[1]
      let newState = osdValue
      newState[lineIndex] = lineValue
      setOsdValue(osdValue => { return Object.assign({}, { ...newState }) })


    }

  }

  React.useState(() => {
    ipcRenderer.on("catch_on_render", handleMessage)
    return (false);
  }, [])
  console.log("render");




  return (
    <div className="App">
      <header className="App-header">
        {Object.values(osdValue).map((value, index) => {
          return (<div className="osd-line">{value}</div>)
        })}

      </header>
    </div>
  );
}

export default App;

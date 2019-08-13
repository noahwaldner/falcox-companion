import React from 'react';
import logo from './logo.svg';
import './App.css';
const { ipcRenderer } = window.require("electron");

const {
  CATCH_ON_RENDER,
  CATCH_ON_MAIN
} = require("./utils/constants")

function App() {
  let [osdValue, setOsdValue] = React.useState(["sdfdf","aaaa","bbbb","fdsaf","adsfads","sdfdf","fsdfds","sdfsd","dasf","fasdf","fdas","dsf","fsadf","fdsa","adsf","asdfds"])

  const handleMessage = (event, data) => {
    let osdValuePair = toString(data).split(",")
    let lineIndex = osdValuePair[0].split(" ")[1]-1
    let lineValue = osdValuePair[1]
    let newState = osdValue
    newState[lineIndex] = lineValue
    setOsdValue(newState)
  }

  React.useState(() => {
    ipcRenderer.on(CATCH_ON_RENDER, handleMessage)
    return (false);
  }, [])

  console.log(osdValue);
  

  return (
    <div className="App">
      <header className="App-header">
          {osdValue.map((value, index)=> {
            return (<div className="osd-line">{value}</div>)
          })}
          
      </header>
    </div>
  );
}

export default App;

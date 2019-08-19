// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')

const startUrl = process.env.ELECTRON_START_URL || `file://${__dirname}/index.html`;
const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter')
var usb = require('usb')
let serialDevice;
let DevicePort;

const CATCH_ON_RENDER = "catch_on_render"

const CATCH_ON_MAIN = "catch_on_main"

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

const initializeSerialDevice = () => {
    mainWindow.send(CATCH_ON_RENDER, "init")
    SerialPort.list((err, ports) => {
        mainWindow.send(CATCH_ON_RENDER, ports)
        ports.forEach(function (port) {

  
                DevicePort = port.comName.toString();

            
        })

        serialDevice = new SerialPort(DevicePort);
        const parser = serialDevice.pipe(new Delimiter({ delimiter: '[?25l' }))
        serialDevice.pipe(parser)
        serialDevice.on("open", (err) => {
            mainWindow.send(CATCH_ON_RENDER, "port opened")
            if (!err) {
                parser.on('data', line => mainWindow.send(CATCH_ON_RENDER, String.fromCharCode.apply(null, line)));
            } else {
                mainWindow.send(CATCH_ON_RENDER, err)
            }


        })



    })
}


function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        icon: __dirname + '../assets/icon.png'
    })

    // and load the index.html of the app.
    mainWindow.loadURL(startUrl)

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    setTimeout(() => {
        initializeSerialDevice()

    }, 1000);

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
})

usb.on('detach', (device) => {
    mainWindow.send(CATCH_ON_RENDER, "ddd")
    SerialPort.list((err, ports) => {
        mainWindow.send(CATCH_ON_RENDER, ports)



    })


});

usb.on('attach', (device) => {
    do {
        if (mainWindow) {
            mainWindow.send(CATCH_ON_RENDER, "attatched")
            setTimeout(() => {
                initializeSerialDevice()
            }, 1000);
        }
    } while (!mainWindow);


});




ipcMain.on(CATCH_ON_MAIN, (event, arg) => {
    serialDevice.write("d")

})





// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
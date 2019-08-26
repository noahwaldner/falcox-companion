// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')

const startUrl = process.env.ELECTRON_START_URL || `file://${__dirname}/index.html`;
const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter')
const Readline = require('@serialport/parser-readline')
const fs = require('fs');
const usb = require('usb')
const { dialog } = require('electron')

const CATCH_ON_RENDER = "catch_on_render"
const CATCH_ON_MAIN = "catch_on_main"

let serialDevice;
let DevicePort;
let savePath;
let backupParams = [];
let mainWindow
let parser
let dumpParser

const initializeSerialDevice = () => {
    mainWindow.send(CATCH_ON_RENDER, "init")
    SerialPort.list((err, ports) => {
        mainWindow.send(CATCH_ON_RENDER, ports)
        ports.forEach(function (port) {
            if (port.vendorId == '0483') {
                DevicePort = port.comName.toString();
            }
        })
        serialDevice = new SerialPort(DevicePort);
        parser = serialDevice.pipe(new Delimiter({ delimiter: '[?25l' }))
        dumpParser = serialDevice.pipe(new Readline({ delimiter: '\r\n' }))
        serialDevice.on("open", (err) => {
            mainWindow.send(CATCH_ON_RENDER, DevicePort)
            mainWindow.send(CATCH_ON_RENDER, "port opened")
            console.log("opened");
            if (!err) {
                serialDevice.write("osdon 1\r\n")
                parser.on('data', line => mainWindow.send(CATCH_ON_RENDER, String.fromCharCode.apply(null, line)));
                dumpParser.on('data', line => {
                    if (line.includes("SET")) {
                        backupParams.push(line)
                        mainWindow.send(CATCH_ON_RENDER, line)
                    } else if (line.includes("Dump Complete")) {
                        saveBackup();
                    }
                });
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
        icon: __dirname + '../assets/icon.png',
        resizable: false
    })

    // and load the index.html of the app.
    mainWindow.loadURL(startUrl)

    // Open the DevTools.
   // mainWindow.webContents.openDevTools()

    setTimeout(() => {
        initializeSerialDevice()
    }, 2000);

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        serialDevice.close()
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

const saveBackup = () => {
    let openDialogOptions = {
        defaultPath: "mySetting.txt",
        properties: ['createDirectory',]
    }
    savePath = dialog.showSaveDialog(null, openDialogOptions).then((path) => {
        try {
            if (!path.canceled) {
                fs.writeFileSync(path.filePath, JSON.stringify(backupParams), 'utf-8');
                mainWindow.send(CATCH_ON_RENDER, "success")
                let messagebox = dialog.showMessageBox(null, { message: "Settings saved successfully!" })
            }
            serialDevice.write("osdon 1\r\n")
        }
        catch {
            mainWindow.send(CATCH_ON_RENDER, "fail");
            let messagebox = dialog.showMessageBox(null, { message: "Error occured while saving file!" })
            serialDevice.write("osdon 1\r\n")
        };
    });
};

const restoreBackup = () => {
    let restoreDialogOptions = {
        filters: [
            { name: 'Falco X Backups', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    }
    dialog.showOpenDialog(null, restoreDialogOptions, (filePaths) => {
        mainWindow.send(CATCH_ON_RENDER, filePaths)
        try {
            fs.readFile(filePaths[0], 'utf8', function (err, contents) {
                try {
                    let restoreParams = JSON.parse(contents);
                    console.log("restoring");
                    
                    restoreParams.forEach((element, key, arr) => {
                   
                        
                            setTimeout(() => {
                    
                                mainWindow.send(CATCH_ON_RENDER, element + " \r\n");
                                serialDevice.write(element + " \r\n")
                                if (key == arr.length - 1) {
                                    serialDevice.write("\r\n")
                                    serialDevice.write("save\r\n")
                                    setTimeout(() => {
                                        serialDevice.write("osdon 1\r\n")
                                        mainWindow.send(CATCH_ON_RENDER, "success");
                                        let messagebox = dialog.showMessageBox(null, { message: "Settings restored successfully!" })
                                    }, 4000);
                                }
                            }, key*20);
                            
                            
                            
                                  
                    });
                } catch (error) {
                    throw "Invalid File"
                }
            });
        } catch {
            mainWindow.send(CATCH_ON_RENDER, "fail");
            let messagebox = dialog.showMessageBox(null, { message: "Error occured while loading file!" })
            serialDevice.write("osdon 1\r\n")
        };
    })
};

ipcMain.on(CATCH_ON_MAIN, (event, arg) => {
    if (arg === "backup") {
        serialDevice.write("osdoff\r\n")
        serialDevice.write("dump\r\n")
    } else if (arg === "restore") {
        serialDevice.write("osdoff\r\n")
        restoreBackup()
    } else if (arg === "dfu") {
        serialDevice.write("dfu\r\n")
    }
})

process.on('uncaughtException', function (error) {
    // Handle the error
});
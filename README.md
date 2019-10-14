Prerequisites:

- node js >8.0 installed
- yarn >1.16 installed
- python >3.7 installed
- open terminal at working directory
- installed xcode
- installed xcode-select `xcode-select --install`

Preparation:
 - run `yarn` to install dependencies

Development:
 - run `yarn dev`to satrt webpack dev server and electron in dev mode
 - Changes in the renderer process will use hotreloading (./src/)
 - Fort Changes in the Main Process you will need to restart the process (./public/electron.js)

Production:
 Note: Because we're using native Modules you can only build for win on win and mac on mac

 mac:
 - Make sure Xcode is installed
 - run `yarn build` to build React app
 - run `yarn compile-mac`to build electron


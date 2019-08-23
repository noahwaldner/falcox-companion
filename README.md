Prerequisites:

- node js >8.0 installed
- yarn >1.16 installed
- python >3.7 installed
- open terminal at working directory

Preparation:
 - run `yarn` to install dependencies

Development:
 - run `yarn dev`to satrt webpack dev server and electron in dev mode

Production:
 Note: Because we're using native Modules you can only build for win on win and mac on mac

 mac:
 - Make sure Xcode is installed
 - run `yarn build` to build React app
 - run `yarn compile-mac`to build electron

 win:
 - run `npm --add-python-to-path='true' --debug install --global windows-build-tools`to install developer tools and set path for python 
 - run `yarn build` to build React app
 - run `yarn compile-mac`to build electron
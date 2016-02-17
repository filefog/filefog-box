# FileFog Provider

[![Circle CI](https://circleci.com/gh/filefog/filefog-box.svg?style=svg)](https://circleci.com/gh/filefog/filefog-box)

A [Filefog](https://github.com/filefog/filefog) adapter for Box.net.

## Install

Install is through NPM.

```bash
$ npm install filefog-box --save
```

## Configuration

The following config options are required:

```javascript
config: {
    client_key : '',
    client_secret : '',
    redirect_url : 'http://localhost:3000/service/callback/box'
};
```

## Testing

Test are written with mocha. Integration tests are handled by the [filefog-provider-tests](https://github.com/filefog/filefog-provider-tests) project, which tests provider methods against the latest FileFog API.

To run tests:

```bash
$ npm test
```

## About FileFog

FileFog is a cloud agnostic file API.  It provides a uniform API for accessing stuff from different kinds of cloud providers and file systems.  That means you write the same code to manipulate files, whether they live in google drive, dropbox, box.net, or your local file system.

To learn more visit the project on GitHub at [FileFog](https://github.com/filefog/filefog).
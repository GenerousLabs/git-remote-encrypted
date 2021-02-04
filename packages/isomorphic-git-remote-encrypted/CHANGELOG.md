# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] - 2021-02-04

### Fixed

- Added back missing export `getIsEncryptedRemoteUrl()`

## [0.4.1] 2021-02-04

### Fixed

- Generated passwords were hardcoded to `foo`

## [0.4.0] 2021-02-03

### Changed

- BREAKING - The file layout of encrypted objects has changed. They're now sharded like git (put into a directory named for the first 2 letters of the hash). If you are using a version < 0.4.0 post an issue and we'll help you rename the files.

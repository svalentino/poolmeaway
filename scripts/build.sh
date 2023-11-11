#!/bin/bash

function build_version() {
	local version=""

	version=$(git describe --tags 2> /dev/null)
	if [[ $? -ne 0 ]]; then
		version="v0.0.0-0-$(git rev-parse --short HEAD)"
	fi

	echo "${version}"
}

zip -r "dist/poolmeaway.$(build_version).zip" icons/pool8_180.png background.js manifest.json nopermissions.html nopermissions.js unknown-error.html unknown-error.js

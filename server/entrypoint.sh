#!/bin/sh -x

if [[ ! -z $SENDGRID_API_KEY_FILE ]]; then
  export SENDGRID_API_KEY=$(cat $SENDGRID_API_KEY_FILE)
fi

exec npm "$@"

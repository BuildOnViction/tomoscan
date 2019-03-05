#!/bin/sh

if [[ ! -z $SENDGRID_API_KEY_FILE ]]; then
  export SENDGRID_API_KEY=$(cat $SENDGRID_API_KEY_FILE)
fi

if [[ ! -z $JWT_SECRET_FILE ]]; then
  export JWT_SECRET=$(cat $JWT_SECRET_FILE)
fi

if [[ ! -z $APP_SECRET_FILE ]]; then
  export APP_SECRET=$(cat $APP_SECRET_FILE)
fi

if [[ ! -z $RE_CAPTCHA_SECRET_FILE ]]; then
  export RE_CAPTCHA_SECRET=$(cat $RE_CAPTCHA_SECRET_FILE)
fi

if [[ ! -z $SLACK_WEBHOOK_URL_FILE ]]; then
  export SLACK_WEBHOOK_URL=$(cat $SLACK_WEBHOOK_URL_FILE)
fi

exec npm "$@"

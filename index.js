const fs = require('fs');
const path = require('path');
const debug = require('debug')('snailmail');
const AWS = require('aws-sdk');
const mustache = require('mustache');

module.exports = (settings = {}) => {

  if (!settings.templateDir || typeof settings.templateDir !== 'string') {
    throw new Error('snailmail: Template directory must be defined');
  }

  if (!settings.from || typeof settings.from !== 'string') {
    throw new Error('snailmail: From address must be defined');
  }

  const client = new AWS.SES({
    region: settings.region,
    accessKeyId: settings.key,
    secretAccessKey: settings.secret
  });

  settings.ext = settings.ext || '.html';
  settings.render = settings.render || mustache.render;

  const _templates = new Promise((resolve, reject) => {
    fs.readdir(settings.templateDir, (err, files) => {
      if (err) {
        return resolve({});
      }
      files = files
        .filter(f => path.extname(f) === settings.ext)
        .reduce((map, f) => {
          return {
            ...map,
            [path.basename(f, settings.ext)]: { path: path.resolve(settings.templateDir, f) }
          };
        }, {});

      resolve(files);
    });
  });

  const getTemplates = () => _templates;

  const loadTemplate = config => {
    return new Promise((resolve, reject) => {
      if (config.content) {
        debug(`Template "${config.path}" found in cache`);
        return resolve(config.content);
      }
      debug(`Template "${config.path}" not found in cache. Loading from fs.`);
      fs.readFile(config.path, (err, content) => {
        if (err) {
          return reject(err);
        }
        config.content = content.toString();
        return resolve(config.content);
      });
    });
  };

  return {
    send: ({ template, data = {}, to, subject = 'No subject' }) => {
      return getTemplates()
        .then(templates => {
          if (!template || !templates[template]) {
            throw new Error(`Unrecognised template: ${template}`);
          }
          return templates[template];
        })
        .then(config => {
          return loadTemplate(config);
        })
        .then(tpl => {
          return settings.render(tpl, data);
        })
        .then(message => {
          return new Promise((resolve, reject) => {
            client.sendEmail({
              Destination: {
                ToAddresses: [ to ]
              },
              Message: {
                Body: {
                  Html: {
                    Charset: 'UTF-8',
                    Data: message
                  }
                },
                Subject: {
                  Charset: 'UTF-8',
                  Data: settings.render(subject, data)
                }
              },
              Source: settings.from
            }, (err, response, r) => {
              err ? reject(err) : resolve(response);
            });
          });
        });
    }
  };

};

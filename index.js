const fs = require('fs');
const path = require('path');
const debug = require('debug')('snailmail');
const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');
const mustache = require('mustache');

module.exports = (settings = {}) => {

  if (!settings.templateDir || typeof settings.templateDir !== 'string') {
    throw new Error('snailmail: Template directory must be defined');
  }

  if (!settings.from || typeof settings.from !== 'string') {
    throw new Error('snailmail: From address must be defined');
  }

  const SES = new AWS.SES({
    region: settings.region,
    accessKeyId: settings.key,
    secretAccessKey: settings.secret
  });

  const mailer = nodemailer.createTransport({ SES });

  settings.ext = settings.ext || '.html';

  const render = mustache.render;

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

  const _layout = new Promise((resolve, reject) => {
    const def = '{{>message}}';
    if (!settings.layout) {
      debug('No layout defined. Using default.');
      return resolve(def);
    }
    debug(`Loading layout from ${settings.layout}`);
    fs.readFile(settings.layout, (err, content) => {
      return err ? reject(err) : resolve(content.toString());
    });
  });

  const getTemplates = () => _templates;
  const getLayout = () => _layout;

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
    send: ({ template, data = {}, to, subject = 'No subject', attachments }) => {
      attachments = Object.assign({}, settings.attachments, attachments);
      attachments = Object.keys(attachments).map(cid => {
        return {
          cid,
          filename: path.basename(attachments[cid]),
          path: attachments[cid]
        }
      });
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
        .then(message => {
          return getLayout()
            .then(layout => render(layout, data, { message }));
        })
        .then(message => {
          return new Promise((resolve, reject) => {
            mailer.sendMail({
              to,
              from: settings.from,
              replyTo: settings.replyTo,
              subject: render(subject, data),
              html: message,
              attachments
            }, (err, response, r) => {
              err ? reject(err) : resolve(response);
            });
          });
        });
    }
  };

};

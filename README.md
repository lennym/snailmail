# snailmail

Render templates into SES emails

## Usage

```js
const Mailer = require('snailmail');

// configure mailer instance
const mailer = Mailer({
  templateDir: __dirname + '/emails',
  from: 'bob@example.com',
  key: 'AKIAXXXXXXXXXXXXXXXX',
  secret: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
  region: 'eu-west-1'
});

// send an email
mail.send({
  template: 'default'
  to: 'alice@example.com',
  subject: 'Test email',
  data: {
    name: 'Alice'
  }
}).then(() => console.log(`Message sent!`));
```

## Mailer options

* `templateDir` - a path to the directory where email templates are found
* `from` - the sender/reply address for your emails
* `key` - AWS accessKeyId for your SES account
* `secret` - AWS secretAccessKey for your SES account
* `region` - AWS region for your SES account
* `ext` - _(optional)_ - the file extension of your email templates - Default `.html`
* `render` - _(optional)_ - the render function used to turn templates into html - Default `require('mustache').render`

## Message options

* `to` - the recipient address
* `template` - the template used to render the message body. Should match the extensionless filename of one of the templates in your template directory
* `subject` - the subject line of your message. This will also be passed through your `render` function, so can contain dynamic content
* `data` - anty dynamic data to be rendered into the subject or body of your message

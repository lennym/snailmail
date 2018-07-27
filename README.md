# snailmail

Render mustache html templates into SES emails

## Usage

```js
/**
./templates/default.html

<p>Hello {{name}}</p>
**/

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
* `layout` - _(optional)_ - the path to a standard layout file to use for your email templates

## Message options

* `to` - the recipient address
* `template` - the template used to render the message body. Should match the extensionless filename of one of the templates in your template directory
* `subject` - the subject line of your message. This will also be passed through `mustache.render`, so can contain dynamic content
* `data` - any dynamic data to be rendered into the subject or body of your message

## Layouts

By default your message templates will be sent exactly as they are defined in the template file. However, if you want to wrap your messages in a standard header/footer then you can define a layout file for your emailer instance.

Your layout will be passed a partial template `message` which it should include - as per the following example:

layout.html

```html
<header>
  <h1>My header content</h1>
</header>
{{>message}}
<footer>
  <p>My footer content</p>
</footer>
```

```js
const mailer = Mailer({
  templateDir: __dirname + '/emails',
  layout: __dirname + '/layout.html',
  // ...
});
```

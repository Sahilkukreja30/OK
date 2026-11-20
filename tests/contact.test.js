import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GENERAL_ENQUIRY_URL, LOOKING_FOR_OPTIONS, enquiryLink } from '../src/config/contact.js';

const answers = { name: ' Asha ', instagram: '@asha.bakes', lookingFor: 'Website design' };
const messageOf = (url) => new URL(url).searchParams.get('text');

test('the enquiry goes to the same WhatsApp number as the plain link', () => {
  assert.equal(new URL(enquiryLink(answers)).pathname, new URL(GENERAL_ENQUIRY_URL).pathname);
});

test('the message carries all three answers, trimmed and readable', () => {
  const text = messageOf(enquiryLink(answers));
  for (const line of ['Name: Asha', 'Instagram: @asha.bakes', 'Looking for: Website design']) {
    assert.ok(text.includes(line), line);
  }
});

test('answers are URL-encoded so & # and newlines survive', () => {
  const url = enquiryLink({ ...answers, name: 'A&B #1' });
  assert.ok(!url.includes(' ') && !url.includes('\n'));
  assert.ok(messageOf(url).includes('Name: A&B #1'));
  assert.ok(!messageOf(enquiryLink(answers)).includes('Business'));
});

test('a topic line is added when the visitor clicked on a service or case study', () => {
  assert.ok(messageOf(enquiryLink({ ...answers, topic: 'About Branding.' })).includes('About Branding.'));
});

test('the form offers the two services', () => {
  assert.deepEqual(LOOKING_FOR_OPTIONS, ['Website design', 'Social media advertising']);
});

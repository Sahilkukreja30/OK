import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GENERAL_ENQUIRY_URL, LOOKING_FOR_OPTIONS, enquiryLink } from '../src/config/contact.js';

const answers = { name: ' Asha ', instagram: '@asha.bakes', lookingFor: 'Website design' };
const messageOf = (url) => new URL(url).searchParams.get('text');

test('the enquiry goes to the same WhatsApp number as the plain link', () => {
  assert.equal(new URL(enquiryLink(answers)).pathname, new URL(GENERAL_ENQUIRY_URL).pathname);
});

test('the message is one friendly paragraph with the exact text for each choice', () => {
  assert.equal(
    messageOf(enquiryLink(answers)),
    "Hi CityReach! I'm Asha, and I'm interested in website design for my business. You can find us on Instagram at @asha.bakes. Looking forward to hearing from you!"
  );
  assert.equal(
    messageOf(enquiryLink({ ...answers, instagram: ' https://instagram.com/asha.bakes ', lookingFor: 'Social media advertising' })),
    "Hi CityReach! I'm Asha, and I'm interested in social media advertising for my business. You can find us on Instagram at https://instagram.com/asha.bakes. Looking forward to hearing from you!"
  );
});

test('answers are URL-encoded so & # and apostrophes survive', () => {
  const url = enquiryLink({ ...answers, name: 'A&B #1' });
  assert.ok(!url.includes(' ') && !url.includes('\n'));
  assert.ok(messageOf(url).includes("I'm A&B #1,"));
});

test('a topic is appended as one more sentence, not a list', () => {
  const text = messageOf(enquiryLink({ ...answers, topic: 'I came across your Branding case study.' }));
  assert.ok(text.endsWith('Looking forward to hearing from you! I came across your Branding case study.'));
  assert.ok(!text.includes('\n'));
});

test('the form offers the two services', () => {
  assert.deepEqual(LOOKING_FOR_OPTIONS, ['Website design', 'Social media advertising']);
});

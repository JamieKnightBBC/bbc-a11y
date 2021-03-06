require 'capybara'
require 'bbc/a11y/linter'
require 'bbc/a11y/javascript'

Given(/^a website running at http:\/\/localhost:(\d+)$/) do |port|
  WebServer.ensure_running_on(port)
end

Given(/^all the tests pass$/) do
  WebServer.ensure_running_on(54321)
  step "I run `a11y http://localhost:54321/perfect.html`"
end

Given(/^one test fails$/) do
  WebServer.ensure_running_on(54321)
  step "I run `a11y http://localhost:54321/missing_header.html`"
end

Given(/^a page with the HTML:$/) do |html|
  WebServer.ensure_running_on(54321)
  browser.visit 'http://localhost:54321/blank.html'
  browser.execute_script "document.write(#{html.to_json});"
end

Given(/^a page with the body:$/) do |body_html|
  WebServer.ensure_running_on(54321)
  browser.visit 'http://localhost:54321/blank.html'
  browser.execute_script "document.body.innerHTML = #{body_html.to_json}"
end

When(/^I validate the \"([^\"]+)\" standard$/) do |standard_name|
  browser.execute_script(BBC::A11y::Javascript.bundle)
  validation = browser.evaluate_script("a11y.validate(#{standard_name.to_json})")
  if validation['results'].size != 1
    raise "#{validation['results'].size} standards match '#{standard_name}' (expected 1 match)"
  end
  @result = BBC::A11y::LintResult.from_json(validation)
end

Then(/^it passes$/) do
  expect(@result).to be_passed
end

Then(/^it fails with the message:$/) do |message|
  expect(@result).to be_failed
  expect(@result.errors.map { |e| e.message}.join("\n")).to eq message
end

Given(/^I am using a TTY terminal$/) do
  set_environment_variable('TTY', 'true')
end

Given(/^I am using a Non\-TTY terminal$/) do
  set_environment_variable('TTY', 'false')
end

When(/^I run a11y against a failing page$/) do
  step 'a website running at http://localhost:54321'
  step 'I run `a11y http://localhost:54321/missing_header.html`'
end

Then(/^I see red in the output$/) do
  all_output = all_commands.map { |c| c.output }.join("\n")
  expect(all_output).to include("\e[31m✗")
end

Then(/^I see monochrome output$/) do
  all_output = all_commands.map { |c| c.output }.join("\n")
  expect(all_output).not_to include('[0;31;49m✗')
end

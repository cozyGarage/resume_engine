Frequently Asked Questions (FAQ)
================================

## How do I get started with HackMyResume?

1. Install with NPM: `[sudo] npm install hackmyresume -g`.

2. Create a new resume with: `hackmyresume NEW <resume-name>.json`.

3. Test with `hackmyresume BUILD <resume-name>.json`. Look in the `out/` folder.

4. Play around with different themes with the `-t` or `--theme` parameter.
You can use any [JSON Resume (JRS)](https://jsonresume.org/themes) theme
with HackMyResume.

## What is JSON Resume (JRS)?

An [open resume standard](http://jsonresume.org/themes/) sponsored by Hired.com.
JSON Resume is JSON-driven and open-source, targeting a worldwide audience.

## How do I use a JSON Resume theme?

JSON Resume (JRS) themes can be installed from NPM and GitHub and passed into
HackMyResume via the `--theme` or `-t` parameter.

1. Install the theme locally. The easiest way to do that is with NPM.

    ```bash
    npm install jsonresume-theme-classy
    ```

2. Pass the theme folder path into HackMyResume:

    ```bash
    hackmyresume BUILD resume.json --theme node_modules/jsonresume-theme-classy
    ```

3. Check your output folder. It's best to view HTML formats over a local web
server connection.

## Should I keep my resume in version control?

Absolutely! As text-based, JSON-driven documents, JSON Resume resumes are
ideal candidates for version control. Future versions of HackMyResume will have
this functionality built in.

## Can I change the default section titles ("Employment", "Skills", etc.)?

If you're using a theme that supports section-title customization, yes.
First, create a HackMyResume options file mapping resume sections to your
preferred section title:

```javascript
// myoptions.json
{
  "sectionTitles": {
    "employment": "empleo",
    "skills": "habilidades",
    "education": "educación"
  }
}
```

Then, pass the options file into the `-o` or `--opts` parameter:

```bash
hackmyresume BUILD resume.json -o myoptions.json
```

## How does resume merging work?

Resume merging is a way of storing your resume in separate files that
HackMyResume will merge into a single "master" resume file prior to generating
specific output formats like HTML or PDF. It's a way of producing flexible,
configurable, targeted resumes with minimal duplication.

For example, a software developer who moonlights as a game programmer might
create three JSON Resume resumes at different levels of specificity:

- **generic.json**: A generic technical resume, suitable for all audiences.
- **game-developer.json**: Overrides and amendments for game developer
positions.
- **blizzard.json**: Overrides and amendments specific to a hypothetical
position at Blizzard.

If you run `hackmyresume BUILD generic.json TO out/resume.all`, HMR will
generate all available output formats for the `generic.json` as usual. But if
you instead run...

```bash
hackmyresume BUILD generic.json game-developer.json TO out/resume.all
```

...HackMyResume will notice that multiple source resumes were specified and
merge `game-developer.json` onto `generic.json` before generating, yielding a
resume that's more suitable for game-developer-related positions.

You can take this a step further. Let's say you want to do a targeted resume
submission to a game developer position at Blizzard, and `blizzard.json`
contains the edits and revisions you'd like to show up in the targeted resume.
In that case, merge again! Feed all three resumes to HackMyResume, in order
from most generic to most specific, and HMR will merge them all prior to
generating the final output format(s) for your resume.

```bash
# Merge blizzard.json onto game-developer.json onto generic.json, then build
hackmyresume BUILD generic.json game-developer.json blizzard.json TO out/resume.all
```

There's no limit to the number of resumes you can merge this way.

You can also divide your resume into files containing different sections:

- **resume-a.json**: Contains `basics`, `work`, and `summary` sections.
- **resume-b.json**: Contains all other sections except `references`.
- **references.json**: Contains the private `references` section.

Under that scenario, `hackmyresume BUILD resume-a.json resume-b.json` would
merge and build.


## The HackMyResume terminal color scheme is giving me a headache. Can I disable it?

Yes. Use the `--no-color` option to disable terminal colors:

`hackmyresume <somecommand> <someoptions> --no-color`

## Can I build my own custom JSON Resume theme?

Yes. The easiest way is to copy an existing JSON Resume theme and make your
changes there. You can test your theme with:

```bash
hackmyresume build resume.json --theme path/to/my/theme/folder
```

## Can I build my own tools / services / apps / websites around JSON Resume?

Yes! HackMyResume is not affiliated with JSON Resume, but like other open
standards, JSON Resume is open-source, permissively licensed, and free of
proprietary lock-in. See the JSON Resume website for details.

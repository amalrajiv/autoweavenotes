# Markdown Syntax Guide

## Basic Syntax

### Headers
```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

### Emphasis
```markdown
*Italic text* or _italic text_
**Bold text** or __bold text__
***Bold and italic*** or ___bold and italic___
~~Strikethrough~~
```

### Lists
```markdown
Unordered List:
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2

Ordered List:
1. First item
2. Second item
   1. Subitem 2.1
   2. Subitem 2.2

Task List:
- [ ] Unchecked task
- [x] Checked task
```

### Links and References
```markdown
# Internal Links (Note References)
[[Note Title]]           # Link to another note
[[Note Title|Alias]]     # Link with custom text

# External Links
[Link Text](URL)
[Link with Title](URL "Title")
```

### Images
```markdown
![Alt text](image-url)
![Alt text](image-url "Image title")
```

### Blockquotes
```markdown
> Single line quote
> Multiple line quote
> > Nested quote
```

## Extended Syntax

### Tables
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

| Left-aligned | Center-aligned | Right-aligned |
|:-------------|:-------------:|-------------:|
| Left         | Center        | Right        |
```

### Code
````markdown
Inline code: `code`

Code block:
```javascript
function example() {
  console.log('Hello, World!');
}
```
````

### Tags and Metadata
```markdown
#tag                    # Create a tag
#multi-word-tag         # Multi-word tag
#project/subtag         # Hierarchical tag
```

### Horizontal Rule
```markdown
---
***
___
```

### Footnotes
```markdown
Here's a sentence with a footnote[^1].

[^1]: This is the footnote.
```

### Definition Lists
```markdown
Term
: Definition
```

### Mathematical Expressions
```markdown
Inline math: $E = mc^2$

Block math:
$$
\frac{n!}{k!(n-k)!} = \binom{n}{k}
$$
```

### Diagrams (Mermaid)
````markdown
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
````

## Keyboard Shortcuts

- `Ctrl/Cmd + B`: Bold text
- `Ctrl/Cmd + I`: Italic text
- `Ctrl/Cmd + K`: Create link
- `Ctrl/Cmd + Shift + V`: Preview mode
- `Ctrl/Cmd + /`: Toggle raw markdown

## Special Features

### Note Linking
- Use `[[` to start a note link
- Type to search existing notes
- Press `Enter` to create the link

### Tag Management
- Use `#` to start a tag
- Tags are automatically collected and indexed
- Click on tags to see all related notes

### AI Features
- Select text and use `Ctrl/Cmd + Shift + A` to trigger AI assistance
- AI can help with:
  - Text formatting
  - Content summarization
  - Finding related notes
  - Suggesting tags

### Graph View
- Shows connections between notes
- Visualizes tag relationships
- Interactive navigation through your knowledge base
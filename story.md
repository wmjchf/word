# WordStory Builder - User Story Document

## Epic 1: Core Functionality - From Photo to Story Generation

* **US_01: First-Time User Onboarding**
    * As a new user, I want a simple welcome guide that explains the core features and usage flow of the app, so I can get started quickly.

* **US_02: Photographing to Recognize Words**
    * As a user, I want to quickly recognize a list of printed or handwritten words by taking a photo, so I don't have to manually enter each word.
    * **Details:**
        * The system should automatically identify words in the image.
        * After recognition, the words should be displayed in a list format.
        * If the OCR accuracy is below 95%, the system should prompt me to retake the photo or edit manually.

* **US_03: Editing Recognition Results**
    * As a user, I want to be able to edit the word list recognized by OCR, such as adding missing words, deleting incorrect recognitions, and correcting spelling errors, to ensure the word list used to generate the story is accurate.

* **US_04: Setting User Difficulty**
    * As a user, I want to set my age group and English proficiency level, so that the AI-generated story is at an appropriate difficulty for me.
    * **Details:**
        * Age group options: Children (6-12), Teenagers (13-18), Adults (18+).
        * English proficiency options: CEFR levels (A1-C2) or descriptions (e.g., "Beginner," "Intermediate").
        * The system should remember my settings and allow me to change them at any time.
        * If I skip the settings, the system should use the last configuration or the default intermediate level (B1).
        * *(Future Version 1.1)* As a user, I want to be able to select topics of interest (e.g., animals, school, science fiction) so that the generated stories are more relevant to my interests.

* **US_05: AI Generates Paragraph Containing Target Words**
    * As a user, I want to be able to automatically generate a logically coherent English paragraph or short story based on the word list I provide and the difficulty level I set.
    * **Details:**
        * The generated content should be between 50-150 words in length.
        * The AI should ensure that all the words I provided appear naturally in the generated paragraph.
        * The AI should adjust the complexity of sentences and vocabulary choices based on my difficulty setting.
        * *(Error Handling)* If the AI generation fails or times out, the system should prompt me and allow me to retry.

* **US_06: Viewing Generation Results and Highlighting Words**
    * As a user, I want to clearly see the AI-generated paragraph, and I want the target words I provided to be highlighted, making it easy for me to learn and understand.

* **US_07: Regenerating the Paragraph**
    * As a user, if I am not satisfied with the AI-generated paragraph, I want to be able to quickly regenerate a new one without having to re-enter the words or set the difficulty (unless I want to change them).

* **US_08: Regenerating After Adjusting Difficulty**
    * As a user, if I find the generated paragraph's difficulty unsuitable, I want to be able to return to the difficulty settings page, adjust them, and regenerate the paragraph based on the new difficulty.

## Epic 2: Auxiliary Learning Features

* **US_09: Text-to-Speech (TTS)**
    * As a user, I want to be able to listen to the AI-generated paragraph being read aloud, and I want to be able to switch the reading speed (normal/slow) to help me improve my listening skills and learn pronunciation.

* **US_10: Viewing Word Definitions**
    * As a user, I want to be able to tap on any word in the paragraph to see its Chinese definition, so I can better understand the content.

* **US_11: Exporting and Sharing**
    * As a user, I want to be able to export the generated paragraph as text or share it as an image card, so I can save it and share my learning progress with others.

## Epic 3: User Accounts and Settings (Future Version)

* *(Future Version)* **US_12: Saving Generation History**
    * As a registered user, I want to be able to save all the paragraphs I've generated and their associated word lists, so I can review and revise them later.

* *(Future Version)* **US_13: User Preference Settings**
    * As a registered user, I want to be able to set my default language, font size, and other app preferences.

## Example Acceptance Criteria (for US_02):

* When the user takes a picture containing printed words, the system should be able to recognize the words within 5 seconds.
* For clear printed text, the OCR accuracy should be 95% or higher.
* The recognized words should be clearly displayed in a list format on the editing page.
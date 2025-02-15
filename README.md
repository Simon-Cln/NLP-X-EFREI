<img src="https://github.com/Simon-Cln/NLP-X-EFREI/raw/main/automated_fact_checking.gif" width="800"/>

# NLP-X-EFREI

> **Automated Fact-Checking with DBpedia**  
> Extract Subject–Relation–Object triples from text, match them to DBpedia properties, and verify statements via SPARQL queries.

---

## Table of Contents
1. [Overview](#overview)  
2. [Key Features](#key-features)  
3. [Tech Stack](#tech-stack)  
4. [Installation & Setup](#installation--setup)  
5. [Usage](#usage)  
6. [Notebook Explanation](#notebook-explanation)  
7. [Roadmap & Improvements](#roadmap--improvements)  
8. [Contributing](#contributing)  
9. [License](#license)

---

## Overview

**NLP-X-EFREI** is a project showcasing how to perform automated fact-checking by leveraging **NLP** for triple extraction and **DBpedia** for knowledge base verification. The system:

- **Extracts** a statement’s Subject, Relation, and Object (S–R–O).  
- **Maps** the natural language relation (e.g., “was born in”) to a DBpedia ontology property (e.g., `dbpedia-owl:birthPlace`).  
- **Looks up** the best matching URIs for the subject and object in DBpedia.  
- **Performs** a SPARQL **ASK** query to verify whether the triple is present.  
- **Offers** fallback or correction logic (e.g., “Michael Jackson died in Los Angeles, California” when the user says just “Los Angeles”).

The **frontend** provides a user interface to query statements, while a **Flask** backend (exposing REST APIs) handles the NLP and DBpedia queries.

---

## Key Features

- **Triple Extraction**  
  - Uses **spaCy** to parse natural language and identify a potential `(Subject, Relation, Object)` triple.  
  - Simple noun-chunk and verb identification approach.

- **Relation Mapping**  
  - A custom dictionary (`RELATION_MAP`) matches user-friendly phrases (e.g., “was born in”) to DBpedia properties (e.g., `http://dbpedia.org/ontology/birthPlace`).

- **DBpedia Lookup**  
  - Converts text like “Barack Obama” into a URI (`http://dbpedia.org/resource/Barack_Obama`) using the [DBpedia Lookup API](https://lookup.dbpedia.org/api/).  
  - Uses **XML parsing** because DBpedia’s Lookup often ignores `application/json` headers.

- **SPARQL Verification**  
  - Runs a SPARQL **ASK** query to confirm if `(subject_uri, property_uri, object_uri)` exists in DBpedia.  
  - Handles partial matches, fuzzy logic, and some indirect verifications (e.g., if a person was actually born in City X, which belongs to the broader Region Y).

- **Fallback / Correction**  
  - If no direct match is found, a “correction” tries to see if DBpedia has a different place or entity that can be indirectly matched to the user statement.

- **Flask API + Frontend**  
  - A simple **Flask** server provides routes like `/ask` and `/get_suggestions`.  
  - The **React/Next.js** (or any other) frontend communicates with these routes to display fact-checking results interactively.

---

## Tech Stack

### Backend (Fact-Checking Pipeline)
- **Python** ≥ 3.7  
- [spaCy](https://spacy.io/) for NLP  
- [NLTK](https://www.nltk.org/) for tokenization / POS tagging (some parts)  
- [fuzzywuzzy](https://github.com/seatgeek/thefuzz) for approximate string matching  
- [SPARQLWrapper](https://rdflib.github.io/sparqlwrapper/) for SPARQL queries  
- **Flask** (with **Flask-CORS**) to serve REST endpoints

### Frontend
- Any **modern JavaScript** framework (React, Next.js, etc.) that queries the Flask backend.  

### External Services
- **DBpedia** (SPARQL endpoint + Lookup API)

---

## Installation & Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Simon-Cln/NLP-X-EFREI.git
   cd NLP-X-EFREI

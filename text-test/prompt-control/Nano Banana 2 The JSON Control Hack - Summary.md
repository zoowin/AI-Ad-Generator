# Nano Banana 2: The JSON Control Hack — Summary

**Source:** [YouTube — Nano Banana 2: The JSON Control Hack](https://www.youtube.com/watch?v=uQc4TGhvDHc)

**Speaker/Host:** Renderrop (AI image editing tutorial channel; runs a Discord community with shared prompts)

**Video Length:** ~9 minutes

---

## Core Thesis

The biggest frustration with AI image editing is loss of control — you ask for one small change and the model hallucinates new furniture, wrecks the perspective, or rewrites the entire scene. The solution demonstrated here is deceptively simple: **convert your image into a JSON code structure first**, then make surgical edits to specific fields in that JSON before feeding it back to the model. By breaking an image down into named objects with explicit properties (color, material, position, dimensions, lighting, camera angles), you give the AI a structured contract to follow rather than an ambiguous natural language prompt. The method works inside **Google Gemini** (gemini.google.com) using the **Nano Banana 2** model — notably the weaker, non-Pro variant — and the results are remarkably precise across 5 progressively harder use cases.

## Setup and Model Choice

The workflow runs entirely inside the Gemini web app at gemini.google.com. The presenter explicitly switches from **Gemini 3.1 Fast** to **Gemini 3.1 Pro** because testing showed "significantly better results" with Pro. The underlying image generation model is **Nano Banana 2** (not the Pro version), which makes the accuracy of the results even more notable — this is the weaker variant performing at a level that suggests the JSON structure is doing the heavy lifting, not raw model capability.

The core mechanic is always the same across all 5 use cases:

1. Upload an image to Gemini
2. Use a specialized prompt to extract a JSON representation of the image
3. Modify specific fields in that JSON
4. Feed the modified JSON + original image back to Gemini
5. Nano Banana 2 regenerates the image with only the targeted changes

The JSON structure changes depending on what you're trying to control — furniture properties, lighting/weather, camera perspective, or text/logos — but the principle is constant: **explicit structure prevents hallucination**.

## Use Case 1: Changing Colors and Materials

The simplest demonstration. An interior room scene is uploaded, and the JSON extraction prompt isolates every object with fields for name, color, material, and position. The JSON output lists the room style first, then breaks down each object systematically.

**Test 1:** The lounge chair's color field is changed from "cream ivory" to "light blue." Result: only the chair color changed. All other furniture and the exact perspective remained identical.

**Test 2 (stacked edits):** Same image, but now 2 simultaneous changes — chair color stays light blue, material changed to "velvet," plus the floor lamp's base color changed to "matte white." Result: spot-on. The velvet texture rendered correctly, the blue was maintained, and the lamp base turned white. Everything else untouched.

**Test 3 (different scene):** A second interior shot to prove reproducibility. The sideboard's material was changed to "oak wood" and a small cup's color changed to "dark red" with material "ceramic." Result: the sideboard rendered as matte oak wood, the cup as glossy dark red ceramic — the AI even correctly differentiated between matte and glossy finishes without being explicitly told.

## Use Case 2: Object Swapping via JSON

This is where difficulty escalates. Swapping an entire armchair in a room with layered, overlapping objects requires a more detailed JSON structure that includes proportions, item type, dimensions, and spatial coordinates.

The workflow requires **3 separate Gemini chats**:

1. **Chat 1:** Extract the JSON of the original room image (furniture-swap-specific prompt)
2. **Chat 2:** Convert the replacement chair image into its own JSON code — even though the chair's orientation didn't match the original scene
3. **Chat 3:** Merge the two JSON codes, telling Gemini to swap the existing armchair with the new one

The merged JSON is then pasted back into Chat 1 along with both images (original room + new chair reference). Despite the orientation mismatch between the reference chair and the scene, the result was described as "fantastic" — the chair was correctly positioned, a pillow was placed back on it, and proper shadows from the room's lighting were applied. The presenter called it "extremely realistic."

## Use Case 3: Weather and Time-of-Day Changes

A living room with a window directly in frame — a deliberately tricky setup. The JSON prompt here focuses on lighting, weather, and shadows rather than furniture.

**First attempt (rainy day):** The lighting and weather matched perfectly, but Nano Banana 2 removed the curtains. The reasoning: the JSON asked for visible rain, so the AI cleared the window to show it. This wasn't a bug — it was a poorly formulated JSON. The same issue appeared with a night scene: requesting window reflections caused the AI to remove anything blocking the window.

**The fix:** Removing the "exterior weather visible" field from the JSON stops the AI from forcing weather elements into the frame. With this correction, the second attempt was "vastly better" — the room stayed nearly identical while the lighting and atmosphere completely transformed.

**Golden hour variant:** Same technique, tested in AI Studio (the presenter's Pro quota ran out, but AI Studio uses the same Nano Banana 2 model). The room remained identical; only the lighting shifted to golden hour warmth.

The key insight: **the JSON structure itself can introduce unintended instructions**. When a field implies the AI needs to show something (like visible weather), the model will modify the scene to comply. Removing that field constrains the model to only affect what you actually want changed.

## Use Case 4: Camera Perspective Transfer

Notoriously difficult for AI — transferring one image's camera perspective onto another. The presenter chose an extreme fisheye shot from a room corner as the source perspective.

The JSON extraction here completely ignores furniture and interior elements, focusing purely on camera properties: **focal length, depth of field, and focal point placement**. This camera-only JSON is then applied to a standard living room image.

Result: the fisheye perspective transferred "flawlessly." The model did have to hallucinate the left and right edges (since the wider perspective reveals areas outside the original frame), but the camera distortion itself was accurately applied. The presenter called it "fantastic."

## Use Case 5: Text and Logo Replacement

The hardest test — something "most AI models fail at miserably."

**Text test:** An image of text made entirely out of bread. The text-specialized JSON prompt defines word separation precisely, so the image structure maps 1:1 to the code. Changing the text field to "sub to renderrop" produced a result the presenter called "amazing" — the bread texture was maintained perfectly and the text read exactly as specified. Again, this was the weaker Nano Banana 2, not Pro.

**Logo test:** A Louis Vuitton logo image. The logo-focused JSON was extracted, then in a new chat, Gemini was told to replace the existing logo with a custom logo. The adjusted JSON + original photo + custom logo were uploaded together. The result "actually worked pretty well" — the presenter acknowledged the specific logo structure was "a tough challenge" but the concept proved viable.

## The Prompt System

All prompts used in the video are available in the Renderrop Discord community (linked in the video description). Different use cases require different specialized prompts:

| Use Case | JSON Focus | Key Fields |
|----------|-----------|------------|
| Color/Material | Object isolation | Name, color, material, position |
| Object Swap | Furniture replacement | Proportions, item type, dimensions, spatial coordinates |
| Weather/Lighting | Atmosphere | Lighting direction, weather type, shadow properties, (optional) exterior visibility |
| Camera Perspective | Camera only | Focal length, depth of field, focal point placement |
| Text/Logo | Typography/branding | Word separation, text content, logo structure |

## Key Takeaways

1. **JSON as a control layer eliminates the core AI image editing problem.** Instead of fighting natural language ambiguity, you give the model a structured contract where every element is explicitly named and parameterized. This is why a single color change doesn't cascade into hallucinated furniture — the JSON locks everything else in place.

2. **Nano Banana 2 (non-Pro) is surprisingly capable when given structure.** The presenter repeatedly emphasizes that these results come from the weaker model variant. The implication: model capability matters less than prompt architecture. JSON structure is the multiplier.

3. **The 3-chat pattern for object swapping is the power move.** Extracting source JSON, extracting replacement JSON, and merging in a clean third chat prevents context contamination and gives the model clear, unambiguous instructions. This multi-chat workflow is more complex but dramatically more reliable.

4. **JSON fields are instructions, not just descriptions.** The weather use case proved that including a field like "exterior weather visible" doesn't just describe the scene — it tells the model to make that element visible, potentially at the cost of other scene elements. Removing fields is as important as editing them.

5. **Camera perspective transfer opens up creative applications.** Being able to extract camera properties (focal length, depth of field) as pure JSON and apply them to any image is a genuinely novel technique — it decouples the "what" (scene content) from the "how" (camera treatment) in a way that standard prompting can't achieve.

6. **Text and logo editing, while not perfect, is viable.** This is traditionally one of AI image generation's weakest areas. The JSON approach gets closer to reliable text rendering by defining word separation and structure explicitly — the bread-text example was nearly flawless.

7. **Gemini 3.1 Pro produces significantly better results than 3.1 Fast** for this workflow. The model switch is worth the quota trade-off if you're doing serious image editing work.

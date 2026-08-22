from app.services.pdf_service import extract_text_from_pdf


file_path = "uploads/resumes/DivitSood_24045048_SOP.pdf"

text = extract_text_from_pdf(file_path)

print("===== EXTRACTED RESUME TEXT =====")
print(text)
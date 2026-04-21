from django import forms


class ContactForm(forms.Form):
    name = forms.CharField(max_length=120)
    email = forms.EmailField()
    message = forms.CharField(widget=forms.Textarea, max_length=4000)

    def subject(self):
        return f"New contact from {self.cleaned_data['name']}"

    def body(self):
        c = self.cleaned_data
        return f"Name: {c['name']}\nEmail: {c['email']}\nMessage: {c['message']}"

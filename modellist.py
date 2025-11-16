import requests
api_key = "AIzaSyD0Q-_Nl7mRN0SQ2-I1CP5jAnBk92G7KCA"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
res = requests.get(url)
print(res.text)
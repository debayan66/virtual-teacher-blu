_LANGS=[
("en","English","English","Latin"),("hi","Hindi","हिन्दी","Devanagari"),("bn","Bengali","বাংলা","Bengali"),("te","Telugu","తెలుగు","Telugu"),("mr","Marathi","मराठी","Devanagari"),("ta","Tamil","தமிழ்","Tamil"),("ur","Urdu","اردو","Arabic"),("ml","Malayalam","മലയാളം","Malayalam"),("gu","Gujarati","ગુજરાતી","Gujarati"),("kn","Kannada","ಕನ್ನಡ","Kannada"),("or","Odia","ଓଡ଼ିଆ","Odia"),("pa","Punjabi","ਪੰਜਾਬੀ","Gurmukhi"),("as","Assamese","অসমীয়া","Bengali"),("mai","Maithili","मैथिली","Devanagari"),("sa","Sanskrit","संस्कृतम्","Devanagari"),("ks","Kashmiri","कॉशुर","Arabic"),("ne","Nepali","नेपाली","Devanagari"),("sd","Sindhi","सिन्धी","Arabic"),("kok","Konkani","कोंकणी","Devanagari"),("doi","Dogri","डोगरी","Devanagari"),("mni","Manipuri","মৈতৈলোন্","Meitei"),("sat","Santali","ᱥᱟᱱᱛᱟᱲᱤ","Ol Chiki"),("brx","Bodo","बर'","Devanagari"),("es","Spanish","Español","Latin"),("fr","French","Français","Latin"),("de","German","Deutsch","Latin"),("ja","Japanese","日本語","Japanese"),("zh","Chinese (Simplified)","简体中文","Han"),("ko","Korean","한국어","Hangul"),("ar","Arabic","العربية","Arabic"),("sw","Swahili","Kiswahili","Latin")]
def registry():
    result=[]
    for code,name,native,script in _LANGS:
        ready=code=="en"
        result.append({"code":code,"name":name,"native":native,"script":script,"translation":"none","captions":"partial" if ready else "none","narration":"none","packMB":0,"assetsInstalled":ready,"requires":[] if ready else ["offline translation engine/pair","local TTS voice","verified font for "+script]})
    return result
def installed(code): return code=="en"



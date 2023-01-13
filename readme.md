# misc

Miscellaneous helper functions

## Libraries

### config

Read configuration settings from file `config.json`

### crypto

Tools to encrypt and hash passwords

#### Functions

md5(message)

hashPassword(password, salt)

newPassword(password)

verifyPassword(salthash, attempt)

hashObject(object)

rowHasher(keys)

### csv

Tools to generate CSV output

#### Functions

decode(str,options)

decode.row(row)

encode(row,options)

encode.row(row)

encode.col(column)

### http

#### Functions

No description

### strings

#### Functions

btoa(ascii)

atob(b64)

duration(millis)

parseDuration(str)

bytes(n,d)

def simpleHash(s):
    h = 0
    for c in s:
        h = ((h << 5) - h) + ord(c)
        h = h & 0xFFFFFFFF
        if h > 0x7FFFFFFF:
            h -= 0x100000000
    print(h)
simpleHash('LaManoDeDios86')

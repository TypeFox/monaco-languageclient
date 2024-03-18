grammar Statemachine

entry Statemachine:
    'statemachine' name=ID
    ('events' events+=Event+)?
    ('commands'    commands+=Command+)?
    'initialState' init=[State]
    states+=State*;

Event:
    name=ID;

Command:
    name=ID;

State:
    'state' name=ID
        ('actions' '{' actions+=[Command]+ '}')?
        transitions+=Transition*
    'end';

Transition:
    event=[Event] '=>' state=[State];

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

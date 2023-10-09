import { HF_ACCESS_TOKEN, MESSAGES_BEFORE_LOGIN, RATE_LIMIT } from "$env/static/private";
import { buildPrompt } from "$lib/buildPrompt";
import { PUBLIC_SEP_TOKEN } from "$lib/constants/publicSepToken";
import { authCondition, requiresUser } from "$lib/server/auth";
import { collections } from "$lib/server/database";
import { modelEndpoint } from "$lib/server/modelEndpoint";
import { models } from "$lib/server/models";
import { ERROR_MESSAGES } from "$lib/stores/errors";
import type { Message } from "$lib/types/Message";
import { trimPrefix } from "$lib/utils/trimPrefix";
import { trimSuffix } from "$lib/utils/trimSuffix";
import { textGenerationStream } from "@huggingface/inference";
import { error } from "@sveltejs/kit";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { AwsClient } from "aws4fetch";
import type { MessageUpdate } from "$lib/types/MessageUpdate";
import { abortedGenerations } from "$lib/server/abortedGenerations";
import { summarize } from "$lib/server/summarize";

const FIXED_ANSWER = [
{"type":"fakeStream","token":" "},
{"type":"fakeStream","token":" Sure"},
{"type":"fakeStream","token":"!"},
{"type":"fakeStream","token":" Here"},
{"type":"fakeStream","token":"'"},
{"type":"fakeStream","token":"s"},
{"type":"fakeStream","token":" a"},
{"type":"fakeStream","token":" simple"},
{"type":"fakeStream","token":" S"},
{"type":"fakeStream","token":"nake"},
{"type":"fakeStream","token":" Game"},
{"type":"fakeStream","token":" using"},
{"type":"fakeStream","token":" Python"},
{"type":"fakeStream","token":"'"},
{"type":"fakeStream","token":"s"},
{"type":"fakeStream","token":" T"},
{"type":"fakeStream","token":"k"},
{"type":"fakeStream","token":"inter"},
{"type":"fakeStream","token":" library"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":" I"},
{"type":"fakeStream","token":"'"},
{"type":"fakeStream","token":"ll"},
{"type":"fakeStream","token":" provide"},
{"type":"fakeStream","token":" comments"},
{"type":"fakeStream","token":" explaining"},
{"type":"fakeStream","token":" each"},
{"type":"fakeStream","token":" part"},
{"type":"fakeStream","token":":"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"```"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"import"},
{"type":"fakeStream","token":" tk"},
{"type":"fakeStream","token":"inter"},
{"type":"fakeStream","token":" as"},
{"type":"fakeStream","token":" tk"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Set"},
{"type":"fakeStream","token":" up"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" window"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"window"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" tk"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"T"},
{"type":"fakeStream","token":"k"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"window"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"title"},
{"type":"fakeStream","token":"(\""},
{"type":"fakeStream","token":"S"},
{"type":"fakeStream","token":"nake"},
{"type":"fakeStream","token":" Game"},
{"type":"fakeStream","token":"\")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"window"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"geometry"},
{"type":"fakeStream","token":"(\""},
{"type":"fakeStream","token":"4"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"4"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"\")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Can"},
{"type":"fakeStream","token":"vas"},
{"type":"fakeStream","token":" where"},
{"type":"fakeStream","token":" we"},
{"type":"fakeStream","token":"'"},
{"type":"fakeStream","token":"ll"},
{"type":"fakeStream","token":" draw"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" game"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" tk"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"Canvas"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"window"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" width"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"4"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" height"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"4"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"pack"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Create"},
{"type":"fakeStream","token":" food"},
{"type":"fakeStream","token":" object"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"fo"},
{"type":"fakeStream","token":"od"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" tk"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"Rect"},
{"type":"fakeStream","token":"angle"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" fill"},
{"type":"fakeStream","token":"=\"#"},
{"type":"fakeStream","token":"FF"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"\","},
{"type":"fakeStream","token":" width"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"2"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" height"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"2"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"fo"},
{"type":"fakeStream","token":"od"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"create"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"5"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" "},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"5"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Define"},
{"type":"fakeStream","token":" our"},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":" ("},
{"type":"fakeStream","token":"the"},
{"type":"fakeStream","token":" s"},
{"type":"fakeStream","token":"nake"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"player"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" tk"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"Rect"},
{"type":"fakeStream","token":"angle"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" fill"},
{"type":"fakeStream","token":"=\"#"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"FF"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"\","},
{"type":"fakeStream","token":" width"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"2"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" height"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"2"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"create"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" "},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Create"},
{"type":"fakeStream","token":" an"},
{"type":"fakeStream","token":" empty"},
{"type":"fakeStream","token":" list"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" store"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" s"},
{"type":"fakeStream","token":"nake"},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"seg"},
{"type":"fakeStream","token":"ments"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" []"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Function"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" s"},
{"type":"fakeStream","token":"nake"},
{"type":"fakeStream","token":" left"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"def"},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"left"},
{"type":"fakeStream","token":"():"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Check"},
{"type":"fakeStream","token":" if"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" user"},
{"type":"fakeStream","token":" pressed"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" left"},
{"type":"fakeStream","token":" arrow"},
{"type":"fakeStream","token":" key"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" if"},
{"type":"fakeStream","token":" canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"get"},
{"type":"fakeStream","token":"key"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":" =="},
{"type":"fakeStream","token":" \""},
{"type":"fakeStream","token":"Left"},
{"type":"fakeStream","token":"\":"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Get"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" previous"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":"'"},
{"type":"fakeStream","token":"s"},
{"type":"fakeStream","token":" coordinates"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"[-"},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"]."},
{"type":"fakeStream","token":"co"},
{"type":"fakeStream","token":"ords"},
{"type":"fakeStream","token":"["},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"]"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"        "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Move"},
{"type":"fakeStream","token":" this"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" left"},
{"type":"fakeStream","token":" by"},
{"type":"fakeStream","token":" subtract"},
{"type":"fakeStream","token":"ing"},
{"type":"fakeStream","token":" from"},
{"type":"fakeStream","token":" x"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"config"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":" -"},
{"type":"fakeStream","token":" "},
{"type":"fakeStream","token":"2"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" y"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"        "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Add"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" new"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" back"},
{"type":"fakeStream","token":" of"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" list"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"insert"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"create"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"w"},
{"type":"fakeStream","token":"info"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"(),"},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"w"},
{"type":"fakeStream","token":"info"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":"()))"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Function"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" s"},
{"type":"fakeStream","token":"nake"},
{"type":"fakeStream","token":" right"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"def"},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"right"},
{"type":"fakeStream","token":"():"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Check"},
{"type":"fakeStream","token":" if"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" user"},
{"type":"fakeStream","token":" pressed"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" right"},
{"type":"fakeStream","token":" arrow"},
{"type":"fakeStream","token":" key"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" if"},
{"type":"fakeStream","token":" canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"get"},
{"type":"fakeStream","token":"key"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":" =="},
{"type":"fakeStream","token":" \""},
{"type":"fakeStream","token":"Right"},
{"type":"fakeStream","token":"\":"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Get"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" previous"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":"'"},
{"type":"fakeStream","token":"s"},
{"type":"fakeStream","token":" coordinates"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"[-"},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"]."},
{"type":"fakeStream","token":"co"},
{"type":"fakeStream","token":"ords"},
{"type":"fakeStream","token":"["},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"]"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"        "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Move"},
{"type":"fakeStream","token":" this"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" right"},
{"type":"fakeStream","token":" by"},
{"type":"fakeStream","token":" adding"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" x"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"config"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":" +"},
{"type":"fakeStream","token":" "},
{"type":"fakeStream","token":"2"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" y"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"        "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Add"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" new"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" back"},
{"type":"fakeStream","token":" of"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" list"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"insert"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"create"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"w"},
{"type":"fakeStream","token":"info"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"(),"},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"w"},
{"type":"fakeStream","token":"info"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":"()))"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Function"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" s"},
{"type":"fakeStream","token":"nake"},
{"type":"fakeStream","token":" up"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"def"},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"up"},
{"type":"fakeStream","token":"():"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Check"},
{"type":"fakeStream","token":" if"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" user"},
{"type":"fakeStream","token":" pressed"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" up"},
{"type":"fakeStream","token":" arrow"},
{"type":"fakeStream","token":" key"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" if"},
{"type":"fakeStream","token":" canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"get"},
{"type":"fakeStream","token":"key"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":" =="},
{"type":"fakeStream","token":" \""},
{"type":"fakeStream","token":"Up"},
{"type":"fakeStream","token":"\":"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Get"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" previous"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":"'"},
{"type":"fakeStream","token":"s"},
{"type":"fakeStream","token":" coordinates"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"[-"},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"]."},
{"type":"fakeStream","token":"co"},
{"type":"fakeStream","token":"ords"},
{"type":"fakeStream","token":"["},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"]"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"        "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Move"},
{"type":"fakeStream","token":" this"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":" up"},
{"type":"fakeStream","token":" by"},
{"type":"fakeStream","token":" subtract"},
{"type":"fakeStream","token":"ing"},
{"type":"fakeStream","token":" from"},
{"type":"fakeStream","token":" y"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"config"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" y"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":" -"},
{"type":"fakeStream","token":" "},
{"type":"fakeStream","token":"2"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"        "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Add"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" new"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" back"},
{"type":"fakeStream","token":" of"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" list"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"insert"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"create"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"w"},
{"type":"fakeStream","token":"info"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"(),"},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"w"},
{"type":"fakeStream","token":"info"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":"()))"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Function"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" s"},
{"type":"fakeStream","token":"nake"},
{"type":"fakeStream","token":" down"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"def"},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"down"},
{"type":"fakeStream","token":"():"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Check"},
{"type":"fakeStream","token":" if"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" user"},
{"type":"fakeStream","token":" pressed"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" down"},
{"type":"fakeStream","token":" arrow"},
{"type":"fakeStream","token":" key"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" if"},
{"type":"fakeStream","token":" canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"get"},
{"type":"fakeStream","token":"key"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":" =="},
{"type":"fakeStream","token":" \""},
{"type":"fakeStream","token":"Down"},
{"type":"fakeStream","token":"\":"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Get"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" previous"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":"'"},
{"type":"fakeStream","token":"s"},
{"type":"fakeStream","token":" coordinates"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"[-"},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"]."},
{"type":"fakeStream","token":"co"},
{"type":"fakeStream","token":"ords"},
{"type":"fakeStream","token":"["},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"]"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"        "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Move"},
{"type":"fakeStream","token":" this"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":" down"},
{"type":"fakeStream","token":" by"},
{"type":"fakeStream","token":" adding"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" y"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"config"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" y"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"prev"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":" +"},
{"type":"fakeStream","token":" "},
{"type":"fakeStream","token":"2"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"        "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Add"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" new"},
{"type":"fakeStream","token":" segment"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" back"},
{"type":"fakeStream","token":" of"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" list"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"insert"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":","},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"create"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"w"},
{"type":"fakeStream","token":"info"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"x"},
{"type":"fakeStream","token":"(),"},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"w"},
{"type":"fakeStream","token":"info"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"y"},
{"type":"fakeStream","token":"()))"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Bind"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" keys"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" their"},
{"type":"fakeStream","token":" respective"},
{"type":"fakeStream","token":" functions"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"bind"},
{"type":"fakeStream","token":"(\"<"},
{"type":"fakeStream","token":"Left"},
{"type":"fakeStream","token":">\","},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"left"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"bind"},
{"type":"fakeStream","token":"(\"<"},
{"type":"fakeStream","token":"Right"},
{"type":"fakeStream","token":">\","},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"right"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"bind"},
{"type":"fakeStream","token":"(\"<"},
{"type":"fakeStream","token":"Up"},
{"type":"fakeStream","token":">\","},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"up"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"bind"},
{"type":"fakeStream","token":"(\"<"},
{"type":"fakeStream","token":"Down"},
{"type":"fakeStream","token":">\","},
{"type":"fakeStream","token":" move"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"down"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" Run"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" game"},
{"type":"fakeStream","token":" loop"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"main"},
{"type":"fakeStream","token":"loop"},
{"type":"fakeStream","token":" ="},
{"type":"fakeStream","token":" True"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"while"},
{"type":"fakeStream","token":" main"},
{"type":"fakeStream","token":"loop"},
{"type":"fakeStream","token":":"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Handle"},
{"type":"fakeStream","token":" events"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"event"},
{"type":"fakeStream","token":"_"},
{"type":"fakeStream","token":"update"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"    "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Clear"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" screen"},
{"type":"fakeStream","token":" and"},
{"type":"fakeStream","token":" red"},
{"type":"fakeStream","token":"raw"},
{"type":"fakeStream","token":" everything"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"delete"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"tk"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"ALL"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" player"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"draw"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" food"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"draw"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" for"},
{"type":"fakeStream","token":" seg"},
{"type":"fakeStream","token":" in"},
{"type":"fakeStream","token":" segments"},
{"type":"fakeStream","token":":"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"       "},
{"type":"fakeStream","token":" seg"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"draw"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"    "},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" Update"},
{"type":"fakeStream","token":" the"},
{"type":"fakeStream","token":" display"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"config"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"scroll"},
{"type":"fakeStream","token":"region"},
{"type":"fakeStream","token":"="},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"b"},
{"type":"fakeStream","token":"box"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"tk"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"ALL"},
{"type":"fakeStream","token":"))"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"   "},
{"type":"fakeStream","token":" canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"after"},
{"type":"fakeStream","token":"("},
{"type":"fakeStream","token":"1"},
{"type":"fakeStream","token":"7"},
{"type":"fakeStream","token":")"},
{"type":"fakeStream","token":" #"},
{"type":"fakeStream","token":" limit"},
{"type":"fakeStream","token":" frames"},
{"type":"fakeStream","token":" per"},
{"type":"fakeStream","token":" second"},
{"type":"fakeStream","token":" to"},
{"type":"fakeStream","token":" "},
{"type":"fakeStream","token":"6"},
{"type":"fakeStream","token":"0"},
{"type":"fakeStream","token":"f"},
{"type":"fakeStream","token":"ps"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"#"},
{"type":"fakeStream","token":" C"},
{"type":"fakeStream","token":"lean"},
{"type":"fakeStream","token":" up"},
{"type":"fakeStream","token":" resources"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"canvas"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"destroy"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"window"},
{"type":"fakeStream","token":"."},
{"type":"fakeStream","token":"destroy"},
{"type":"fakeStream","token":"()"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"```"},
{"type":"fakeStream","token":"\n"},
{"type":"fakeStream","token":"Ex"},
];

export async function POST({ request, fetch, locals, params, getClientAddress }) {
	const id = z.string().parse(params.id);
	const convId = new ObjectId(id);
	const promptedAt = new Date();

	const userId = locals.user?._id ?? locals.sessionId;

	// check user
	if (!userId) {
		throw error(401, "Unauthorized");
	}

	// check if the user has access to the conversation
	const conv = await collections.conversations.findOne({
		_id: convId,
		...authCondition(locals),
	});

	if (!conv) {
		throw error(404, "Conversation not found");
	}

	// register the event for ratelimiting
	await collections.messageEvents.insertOne({
		userId: userId,
		createdAt: new Date(),
		ip: getClientAddress(),
	});

	// make sure an anonymous user can't post more than one message
	if (
		!locals.user?._id &&
		requiresUser &&
		conv.messages.length > (MESSAGES_BEFORE_LOGIN ? parseInt(MESSAGES_BEFORE_LOGIN) : 0)
	) {
		throw error(429, "Exceeded number of messages before login");
	}

	// check if the user is rate limited
	const nEvents = Math.max(
		await collections.messageEvents.countDocuments({ userId }),
		await collections.messageEvents.countDocuments({ ip: getClientAddress() })
	);

	if (RATE_LIMIT != "" && nEvents > parseInt(RATE_LIMIT)) {
		throw error(429, ERROR_MESSAGES.rateLimited);
	}

	// fetch the model
	const model = models.find((m) => m.id === conv.model);

	if (!model) {
		throw error(410, "Model not available anymore");
	}

	// finally parse the content of the request
	const json = await request.json();

	const {
		inputs: newPrompt,
		response_id: responseId,
		id: messageId,
		is_retry,
		web_search: webSearch,
	} = z
		.object({
			inputs: z.string().trim().min(1),
			id: z.optional(z.string().uuid()),
			response_id: z.optional(z.string().uuid()),
			is_retry: z.optional(z.boolean()),
			web_search: z.optional(z.boolean()),
		})
		.parse(json);

	// get the list of messages
	// while checking for retries
	let messages = (() => {
		if (is_retry && messageId) {
			// if the message is a retry, replace the message and remove the messages after it
			let retryMessageIdx = conv.messages.findIndex((message) => message.id === messageId);
			if (retryMessageIdx === -1) {
				retryMessageIdx = conv.messages.length;
			}
			return [
				...conv.messages.slice(0, retryMessageIdx),
				{ content: newPrompt, from: "user", id: messageId as Message["id"], updatedAt: new Date() },
			];
		} // else append the message at the bottom

		return [
			...conv.messages,
			{
				content: newPrompt,
				from: "user",
				id: (messageId as Message["id"]) || crypto.randomUUID(),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];
	})() satisfies Message[];

	if (conv.title.startsWith("Untitled")) {
		try {
			conv.title = (await summarize(newPrompt)) ?? conv.title;
		} catch (e) {
			console.error(e);
		}
	}

	// we now build the stream
	const stream = new ReadableStream({
		async start(controller) {
			const updates: MessageUpdate[] = [];

			function update(newUpdate: MessageUpdate) {
				if (newUpdate.type !== "stream") {
					updates.push(newUpdate);
				}
				controller.enqueue(JSON.stringify(newUpdate) + "\n");
			}

			update({ type: "status", status: "started" });

			// we can now build the prompt using the messages
			const prompt = await buildPrompt({
				messages,
				model,
				preprompt: conv.preprompt ?? model.preprompt,
				locals: locals,
			});

			/*const interval = setInterval(() => {
				controller.enqueue(JSON.stringify({
					type: "fakeStream",
					token: "dummy "
				}) + "\n");
			}, 10);*/

			let index = 0;
			const interval = setInterval(() => {
				if (index < FIXED_ANSWER.length) {
					controller.enqueue(JSON.stringify({
						type: "fakeStream",
						token: FIXED_ANSWER[index].token,
					}) + "\n");
					index += 1;
				} else {
					clearInterval(interval);
				}
			}, 10);


			// fetch the endpoint
			const randomEndpoint = modelEndpoint(model);

			let usedFetch = fetch;

			if (randomEndpoint.host === "sagemaker") {
				const aws = new AwsClient({
					accessKeyId: randomEndpoint.accessKey,
					secretAccessKey: randomEndpoint.secretKey,
					sessionToken: randomEndpoint.sessionToken,
					service: "sagemaker",
				});

				usedFetch = aws.fetch.bind(aws) as typeof fetch;
			}

			async function saveLast(generated_text: string) {
				if (!conv) {
					throw error(404, "Conversation not found");
				}

				const lastMessage = messages[messages.length - 1];

				if (lastMessage) {
					// We could also check if PUBLIC_ASSISTANT_MESSAGE_TOKEN is present and use it to slice the text
					if (generated_text.startsWith(prompt)) {
						generated_text = generated_text.slice(prompt.length);
					}

					generated_text = trimSuffix(
						trimPrefix(generated_text, "<|startoftext|>"),
						PUBLIC_SEP_TOKEN
					).trimEnd();

					// remove the stop tokens
					for (const stop of [...(model?.parameters?.stop ?? []), "<|endoftext|>"]) {
						if (generated_text.endsWith(stop)) {
							generated_text = generated_text.slice(0, -stop.length).trimEnd();
						}
					}
					lastMessage.content = generated_text;

					await collections.conversations.updateOne(
						{
							_id: convId,
						},
						{
							$set: {
								messages,
								title: conv.title,
								updatedAt: new Date(),
							},
						}
					);

					update({
						type: "finalAnswer",
						text: generated_text,
					});
				}
			}

			const tokenStream = textGenerationStream(
				{
					parameters: {
						...models.find((m) => m.id === conv.model)?.parameters,
						return_full_text: false,
					},
					model: randomEndpoint.url,
					inputs: prompt,
					accessToken: randomEndpoint.host === "sagemaker" ? undefined : HF_ACCESS_TOKEN,
				},
				{
					use_cache: false,
					fetch: usedFetch,
				}
			);

			for await (const output of tokenStream) {
				// if not generated_text is here it means the generation is not done
				if (!output.generated_text) {
					// else we get the next token
					if (!output.token.special) {
						const lastMessage = messages[messages.length - 1];
						update({
							type: "stream",
							token: output.token.text,
						});

						// if the last message is not from assistant, it means this is the first token
						if (lastMessage?.from !== "assistant") {
							// so we create a new message
							messages = [
								...messages,
								// id doesn't match the backend id but it's not important for assistant messages
								// First token has a space at the beginning, trim it
								{
									from: "assistant",
									content: output.token.text.trimStart(),
									updates: updates,
									id: (responseId as Message["id"]) || crypto.randomUUID(),
									createdAt: new Date(),
									updatedAt: new Date(),
								},
							];
						} else {
							const date = abortedGenerations.get(convId.toString());
							if (date && date > promptedAt) {
								saveLast(lastMessage.content);
							}
							if (!output) {
								break;
							}

							// otherwise we just concatenate tokens
							lastMessage.content += output.token.text;
						}
					}
				} else {
					saveLast(output.generated_text);
				}
			}
		},
		async cancel() {
			await collections.conversations.updateOne(
				{
					_id: convId,
				},
				{
					$set: {
						messages,
						title: conv.title,
						updatedAt: new Date(),
					},
				}
			);
		},
	});

	// Todo: maybe we should wait for the message to be saved before ending the response - in case of errors
	return new Response(stream);
}

export async function DELETE({ locals, params }) {
	const convId = new ObjectId(params.id);

	const conv = await collections.conversations.findOne({
		_id: convId,
		...authCondition(locals),
	});

	if (!conv) {
		throw error(404, "Conversation not found");
	}

	await collections.conversations.deleteOne({ _id: conv._id });

	return new Response();
}

export async function PATCH({ request, locals, params }) {
	const { title } = z
		.object({ title: z.string().trim().min(1).max(100) })
		.parse(await request.json());

	const convId = new ObjectId(params.id);

	const conv = await collections.conversations.findOne({
		_id: convId,
		...authCondition(locals),
	});

	if (!conv) {
		throw error(404, "Conversation not found");
	}

	await collections.conversations.updateOne(
		{
			_id: convId,
		},
		{
			$set: {
				title,
			},
		}
	);

	return new Response();
}

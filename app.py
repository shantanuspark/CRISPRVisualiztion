import os
from flask import Flask, render_template, request
from werkzeug import secure_filename
import time
import random
import subprocess
import os.path
import json
from flask import jsonify
from Bio.Seq import Seq
from Bio import motifs,SeqIO
from dna_features_viewer import GraphicFeature, GraphicRecord, CircularGraphicRecord

app = Flask(__name__)

'''
Function to create a random file name
'''
def randomDigits(digits):
    lower = 10**(digits-1)
    upper = 10**digits - 1
    return random.randint(lower, upper)

'''
GET service to serve the index page
'''
@app.route('/')
def render_index():
   return render_template('index.html')
	
'''
POST service to upload the json file to the uploaded sequences folder
'''
@app.route('/uploader', methods = ['POST'])
def upload_file():
   try:
      filename = str(randomDigits(9))+".json"
      f = request.files['seqfile'].save(secure_filename(filename))
   except:
      return 'File Upload Error', 400
   with open(filename,"r") as f:
      data = json.load(f)
      data['file_name'] = filename.split('.')[0]
   return jsonify(data)

'''
POST function to create web sequnce logo using Biopython
'''
@app.route('/generate_image/<file_name>', methods = ['POST'])
def create_webLogo(file_name):
    repeats = request.get_json()
    m = motifs.create(list(repeats))
    m.weblogo('static/logos/'+str(file_name)+'.png')
    return jsonify('{"success":1}')

'''
POST function to create the CRISPR structure using the dna_feature_viewer package
'''
@app.route('/generate_dna_struct/<file_name>', methods = ['POST'])
def create_dna_structure(file_name):
   results = request.get_json()
   features = []
   for i, spacerRepeat in enumerate(results['spacerRepeats']):
      features.append(GraphicFeature(start=spacerRepeat['position'], end=spacerRepeat['position']+len(spacerRepeat['repeat']), 
                  strand=+1, color="#cffccc", label="Repeat_"+str(i+1)))
      if 'spacer' in spacerRepeat:
         features.append(GraphicFeature(start=spacerRepeat['position']+len(spacerRepeat['repeat'])+1, 
         end=spacerRepeat['position']+len(spacerRepeat['repeat'])+spacerRepeat['lengths'][1], strand=+1, color="#ccccff",
                   label="Spacer_"+str(i+1)))
   record = GraphicRecord(sequence_length=results['length'], features=features)
   record = record.crop((results['spacerRepeats'][0]['position']-50, 
      results['spacerRepeats'][len(results['spacerRepeats'])-1]['position']+
      len(results['spacerRepeats'][len(results['spacerRepeats'])-1]['repeat'])+50))
   ax, _ = record.plot(figure_width=10)
   ax.figure.savefig('static/logos/'+str(file_name)+'.png', bbox_inches='tight')
   return jsonify('{"success":1}')

'''
POST function to create the 2D structure using the RNAStructure package
'''		
@app.route('/generate_structure/<file_name>', methods = ['POST'])
def create_2dStructure(file_name):
   sequence = request.get_json()
   with open("uploaded_sequences/"+file_name+".fasta", "w") as output_handle:
      output_handle.write(">repeat\n"+sequence['seq'])

   if os.path.isfile('uploaded_sequences/'+file_name+'.fasta'):
      print('file found', 'uploaded_sequences/'+file_name+'.fasta')
      subprocess.call(['C:\Program Files\RNAstructure6.1\exe\Fold', 'uploaded_sequences/'+file_name+'.fasta', 'uploaded_sequences/'+file_name+'.ct',
       '--DNA', '--loop' , '30', '--maximum', '20', '--percent', '10', '--temperature', '310.15', '--window', '3'])
   else:
      raise Exception()

   if os.path.isfile('uploaded_sequences/'+file_name+'.ct'):
      subprocess.call(['C:\Program Files\RNAstructure6.1\exe\draw', 'uploaded_sequences/'+file_name+'.ct', 'static/logos/'+file_name+'.svg',
       '--svg', '-n' , '1'])
   else:
      raise Exception()

   return jsonify('{"success":1}')


if __name__ == '__main__':
   app.run(host='0.0.0.0', port=8001)
  
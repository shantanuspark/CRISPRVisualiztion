# CRISPRVisualiztion

The tool can be accessed online <a href="http://crisprlstm.westus.cloudapp.azure.com:8001/">here</a>.

CRISPRVisualiztion is an easy, highly interactive and intuitive way to visualize CRISPR arrays on a web page. It can be incorporated in any of the CRISPR tools, where CRISPR array visualization is requried.

Steps to setup CRISPRVisualiztion:
1. Install RNAStructure from http://rna.urmc.rochester.edu/RNAstructureDownload.html
2. Set DATAPATH environemnt variable as [PATH_TO_RNAstructure]/data_tables
3. Install requirements.txt using <i>pip install -r requirements.txt</i>
4. Create 2 empty folders: 'uploaded_sequences' in root directory of the repo and 'logos' inside the 'static' directory

Once the setup is done, you can run the program from the project directory using:
python app.py

Open the browser window and go to http://localhost

Sample input files are provided in the input_sequences folder, upload any of those files to see how the CRISPR visualizations look.

Few of the features:
In the visualization clicking on any of the sequences(repeats or spacers) will create a 2D structure of the sequence and will have an option to blast the sequence on ncbi.
For each CRISPR array, there is an option to create repeat web logo and an otpion to visualize the positions of the each of the repeats and spacers

//run only on nodes with docker (label) installed
node('nodejs'){
    dir('/Pavia/mpi_api') {
        git credentialsId: 'e1340a16-bdab-4d7f-9cba-51cc21229bc2', url: 'https://github.com/paviasystems/mpi_api.git'

        try {
            sh 'echo "build number = $BUILD_NUMBER"'
            sh './codegen.sh'
            sh 'sed -i \'\' \'s/"version": "3.0.*"/"version": "3.0.$BUILD_NUMBER"/\' ./package.json'
            sh 'npm publish .'

            currentBuild.result = 'SUCCESS'
        } catch (Exception err) {
            currentBuild.result = 'FAILURE'
        }
    }
}